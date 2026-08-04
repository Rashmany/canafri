import cron from 'node-cron';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

// ── Configuration from environment ────────────────────────────────────────────
const CRON_SCHEDULE     = process.env.CLEANUP_CRON_SCHEDULE ?? '0 3 * * *';
const BATCH_SIZE        = parseInt(process.env.CLEANUP_BATCH_SIZE ?? '500', 10);
const AUDIT_RETAIN_DAYS = parseInt(process.env.SECURITY_AUDIT_RETENTION_DAYS ?? '180', 10);
const RISK_RETAIN_DAYS  = parseInt(process.env.RISK_FLAG_RETENTION_DAYS ?? '90', 10);
const ARCHIVE_PATH      = process.env.SECURITY_AUDIT_ARCHIVE_PATH ?? '';

// Redis lock key and TTL (1 hour — generous enough for large datasets)
const LOCK_KEY = 'cleanup_lock';
const LOCK_TTL = 3600; // seconds

// Atomic compare-and-delete Lua script — ownership check + DEL in a single Redis operation.
// Eliminates TOCTOU race conditions in multi-instance deployments.
const LUA_RELEASE_LOCK = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  end
  return 0
`;

// ── Atomic lock release ────────────────────────────────────────────────────────
async function releaseLock(instanceId: string): Promise<void> {
  try {
    await (redis as any).eval(LUA_RELEASE_LOCK, 1, LOCK_KEY, instanceId);
  } catch (err) {
    console.error('[Cleanup] Failed to release Redis lock:', err);
  }
}

// ── Metrics accumulator ────────────────────────────────────────────────────────
interface CleanupMetrics {
  sessionsDeleted: number;
  auditsProcessed: number;
  riskFlagsDeleted: number;
  durationMs: number;
  status: 'SUCCESS' | 'PARTIAL' | 'SKIPPED' | 'ERROR';
  errors: string[];
}

// ── Main cleanup job ──────────────────────────────────────────────────────────
async function runCleanup(): Promise<void> {
  const instanceId = randomUUID();
  const startMs    = Date.now();
  const metrics: CleanupMetrics = {
    sessionsDeleted: 0,
    auditsProcessed: 0,
    riskFlagsDeleted: 0,
    durationMs: 0,
    status: 'SUCCESS',
    errors: [],
  };

  // ── 1. Acquire distributed Redis lock (NX = only set if key doesn't exist) ──
  const acquired = await redis.set(LOCK_KEY, instanceId, { NX: true, EX: LOCK_TTL });
  if (!acquired) {
    console.log('[Cleanup] Skipped — another instance is already running cleanup.');
    return;
  }

  console.log(`[Cleanup] Job started. Instance: ${instanceId}`);

  try {

    // ── 2. Delete expired sessions (idempotent — safe to re-run) ────────────
    try {
      const expiryCutoff = new Date();
      let sessionBatch = 0;
      do {
        const toDelete = await prisma.session.findMany({
          where: { expiresAt: { lt: expiryCutoff } },
          select: { id: true },
          take: BATCH_SIZE,
        });
        if (toDelete.length === 0) break;
        const ids = toDelete.map(s => s.id);
        const result = await prisma.session.deleteMany({ where: { id: { in: ids } } });
        sessionBatch += result.count;
      } while (true);
      metrics.sessionsDeleted = sessionBatch;
    } catch (err: any) {
      const msg = `Session cleanup batch failed: ${err?.message}`;
      console.error('[Cleanup]', msg);
      metrics.errors.push(msg);
      metrics.status = 'PARTIAL';
    }

    // ── 3. Archive / delete old SecurityAudit records ────────────────────────
    try {
      const auditCutoff = new Date();
      auditCutoff.setDate(auditCutoff.getDate() - AUDIT_RETAIN_DAYS);

      let auditBatch = 0;
      do {
        const toProcess = await prisma.securityAudit.findMany({
          where: { createdAt: { lt: auditCutoff } },
          take: BATCH_SIZE,
        });
        if (toProcess.length === 0) break;

        // Archive to file system if SECURITY_AUDIT_ARCHIVE_PATH is configured
        if (ARCHIVE_PATH) {
          try {
            const { appendFile } = await import('fs/promises');
            const { join } = await import('path');
            const date      = new Date().toISOString().slice(0, 10);
            const archiveFile = join(ARCHIVE_PATH, `security_audit_${date}.ndjson`);
            const lines       = toProcess.map(r => JSON.stringify(r)).join('\n') + '\n';
            await appendFile(archiveFile, lines, 'utf8');
          } catch (archiveErr: any) {
            const msg = `SecurityAudit archive write failed: ${archiveErr?.message}`;
            console.error('[Cleanup]', msg);
            metrics.errors.push(msg);
          }
        }

        const ids = toProcess.map(r => r.id);
        await prisma.securityAudit.deleteMany({ where: { id: { in: ids } } });
        auditBatch += toProcess.length;
      } while (true);
      metrics.auditsProcessed = auditBatch;
    } catch (err: any) {
      const msg = `SecurityAudit cleanup batch failed: ${err?.message}`;
      console.error('[Cleanup]', msg);
      metrics.errors.push(msg);
      metrics.status = 'PARTIAL';
    }

    // ── 4. Delete resolved RiskFlag records ────────────────────────────────
    try {
      const riskCutoff = new Date();
      riskCutoff.setDate(riskCutoff.getDate() - RISK_RETAIN_DAYS);

      let riskBatch = 0;
      do {
        const toDelete = await prisma.riskFlag.findMany({
          where: {
            resolved:   true,
            resolvedAt: { lt: riskCutoff },
          },
          select: { id: true },
          take: BATCH_SIZE,
        });
        if (toDelete.length === 0) break;
        const ids = toDelete.map(r => r.id);
        const result = await prisma.riskFlag.deleteMany({ where: { id: { in: ids } } });
        riskBatch += result.count;
      } while (true);
      metrics.riskFlagsDeleted = riskBatch;
    } catch (err: any) {
      const msg = `RiskFlag cleanup batch failed: ${err?.message}`;
      console.error('[Cleanup]', msg);
      metrics.errors.push(msg);
      metrics.status = 'PARTIAL';
    }

  } finally {
    // ── 5. Always release the distributed lock atomically (even on exception) ─
    await releaseLock(instanceId);

    metrics.durationMs = Date.now() - startMs;
    console.log('[Cleanup] Job complete:', {
      status:           metrics.status,
      sessionsDeleted:  metrics.sessionsDeleted,
      auditsProcessed:  metrics.auditsProcessed,
      riskFlagsDeleted: metrics.riskFlagsDeleted,
      durationMs:       metrics.durationMs,
      errors:           metrics.errors.length > 0 ? metrics.errors : undefined,
    });
  }
}

// ── Public: register the cron scheduler ─────────────────────────────────────
export function initCleanupScheduler(): void {
  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(`[Cleanup] Invalid CLEANUP_CRON_SCHEDULE: "${CRON_SCHEDULE}". Skipping scheduler.`);
    return;
  }

  cron.schedule(CRON_SCHEDULE, () => {
    // Run async in the background — never blocks the event loop
    runCleanup().catch(err => {
      console.error('[Cleanup] Unhandled error in cleanup job:', err);
    });
  });

  console.log(`[Cleanup] Scheduled daily maintenance cron: "${CRON_SCHEDULE}"`);
}

import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { AuditService } from './audit.js';

/**
 * Background worker function to permanently anonymize PII and finalize account deletion
 * for accounts whose 7-day grace period has expired (status === 'PENDING_DELETION' and deletionScheduledFor <= now).
 * Legally compliant with GDPR Article 17, FATF AML audit retention rules, and App Store guidelines.
 */
export async function finalizeExpiredAccountDeletions(): Promise<number> {
  let count = 0;
  try {
    const expiredUsers = await prisma.user.findMany({
      where: {
        status: 'PENDING_DELETION',
        deletionScheduledFor: { lte: new Date() },
      },
      select: { id: true, email: true, username: true },
    });

    for (const user of expiredUsers) {
      try {
        const anonymizedId = user.id.slice(-8);
        const timestamp = Date.now();

        // 1. Scrub PII and wipe authentication secrets permanently
        await prisma.user.update({
          where: { id: user.id },
          data: {
            status: 'DELETED',
            displayName: 'Deleted User',
            username: `deleted_${anonymizedId}_${timestamp}`,
            email: `deleted_${anonymizedId}_${timestamp}@anonymized.local`,
            phoneHash: null,
            avatarUrl: null,
            bio: null,
            passwordHash: null,
            totpSecret: null,
            totpEnabled: false,
            totpRecoveryHashes: [],
            passwordHistory: [],
          },
        });

        // 2. Revoke any remaining session keys in Redis & PostgreSQL
        const sessions = await prisma.session.findMany({ where: { userId: user.id } });
        for (const s of sessions) {
          await redis.del(`session:${s.id}`);
        }
        await prisma.session.deleteMany({ where: { userId: user.id } });

        // 3. Log Audit Event
        await AuditService.log({
          userId: user.id,
          action: 'ACCOUNT_DELETION_FINALIZED',
          metadata: { anonymizedAt: new Date().toISOString() },
        });

        count++;
      } catch (userErr) {
        console.error(`[AccountDeletionWorker] Failed to finalize user ${user.id}:`, userErr);
      }
    }
  } catch (err) {
    console.error('[AccountDeletionWorker] Error running finalization sweep:', err);
  }
  return count;
}

/**
 * Initializes the recurring background worker (runs hourly)
 */
export function startAccountDeletionWorker() {
  // Run sweep on startup (non-blocking)
  finalizeExpiredAccountDeletions().catch(() => {});

  // Schedule hourly check
  setInterval(() => {
    finalizeExpiredAccountDeletions().catch(() => {});
  }, 60 * 60 * 1000); // 1 hour interval
}

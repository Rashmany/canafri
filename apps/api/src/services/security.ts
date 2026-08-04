import { prisma } from '../lib/prisma.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SecurityAuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'REFRESH_ROTATED'
  | 'GRACE_WINDOW_USED'
  | 'TOKEN_THEFT_DETECTED'
  | 'DEVICE_CHANGED'
  | 'COUNTRY_CHANGED'
  | 'SESSION_REVOKED'
  | 'SUSPICIOUS_UA_CHANGE';

export type RiskFlagType =
  | 'UA_PATCH_CHANGE'
  | 'SUBNET_SHIFT'
  | 'COUNTRY_CHANGE'
  | 'DEVICE_MISMATCH'
  | 'GRACE_WINDOW_REUSE'
  | 'TOKEN_THEFT_DETECTED';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface SecurityAuditParams {
  userId?: string;
  sessionId?: string;
  deviceId?: string;
  action: SecurityAuditAction | string;
  ipAddress?: string;
  country?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

interface RiskFlagParams {
  userId: string;
  sessionId?: string;
  severity: RiskSeverity;
  flag: RiskFlagType | string;
  metadata?: Record<string, unknown>;
}

// ── Activity Update Throttle ───────────────────────────────────────────────────
// In-memory map: sessionId → lastWrittenAt timestamp
// Prevents excessive DB writes on frequent API calls.
const activityWriteCache = new Map<string, number>();

const ACTIVITY_UPDATE_MS =
  parseInt(process.env.SESSION_ACTIVITY_UPDATE_MINUTES ?? '5', 10) * 60 * 1000;

// ── SecurityService ────────────────────────────────────────────────────────────

export class SecurityService {
  /**
   * Records a structured security audit event.
   * Never throws — audit failures are logged to stderr only.
   */
  static async audit(params: SecurityAuditParams): Promise<void> {
    try {
      await prisma.securityAudit.create({
        data: {
          userId:    params.userId    ?? undefined,
          sessionId: params.sessionId ?? undefined,
          deviceId:  params.deviceId  ?? undefined,
          action:    params.action,
          ipAddress: params.ipAddress ?? undefined,
          country:   params.country   ?? undefined,
          userAgent: params.userAgent ?? undefined,
          metadata:  params.metadata  as any ?? undefined,
        },
      });
    } catch (err) {
      console.error('[SecurityService] Failed to write SecurityAudit:', params.action, err);
    }
  }

  /**
   * Creates a RiskFlag entry for a user session.
   * Never throws.
   */
  static async flagRisk(params: RiskFlagParams): Promise<void> {
    try {
      await prisma.riskFlag.create({
        data: {
          userId:    params.userId,
          sessionId: params.sessionId ?? undefined,
          severity:  params.severity,
          flag:      params.flag,
          metadata:  params.metadata as any ?? undefined,
        },
      });
    } catch (err) {
      console.error('[SecurityService] Failed to write RiskFlag:', params.flag, err);
    }
  }

  /**
   * Updates Session.lastActivityAt throttled to SESSION_ACTIVITY_UPDATE_MINUTES.
   * Prevents high-frequency DB writes for every API call.
   * Never throws.
   */
  static async updateLastActivity(sessionId: string): Promise<void> {
    try {
      const now = Date.now();
      const last = activityWriteCache.get(sessionId) ?? 0;

      if (now - last < ACTIVITY_UPDATE_MS) return;

      activityWriteCache.set(sessionId, now);
      await prisma.session.update({
        where: { id: sessionId },
        data: { lastActivityAt: new Date() },
      });
    } catch (err) {
      console.error('[SecurityService] Failed to update lastActivityAt:', sessionId, err);
    }
  }
}

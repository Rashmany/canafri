/**
 * TrustEngine
 *
 * Manages trust score completely independently from security risk.
 * Trust grows through positive participation and only decreases
 * through confirmed misconduct — it is NEVER derived from riskScore.
 *
 * Score changes are written to TrustEvent for full auditability.
 */

import { prisma } from '../lib/prisma.js';

// ── Trust deltas per event type ───────────────────────────────────────────────
// Keep in one place so they can be tuned without touching route logic.

const TRUST_DELTA = {
  JOB_COMPLETE:      +5,
  ESCROW_COMPLETE:   +3,
  POSITIVE_REVIEW:   +2,
  CONTENT_PUBLISHED: +1,
  DISPUTE_LOSS:      -10,
  POLICY_VIOLATION:  -5,
} as const;

// ── Internal helper ───────────────────────────────────────────────────────────

async function applyTrustDelta(
  userId:   string,
  delta:    number,
  category: 'JOB_COMPLETE' | 'ESCROW_COMPLETE' | 'ACCOUNT_AGE' | 'POSITIVE_REVIEW' |
            'CONTENT_PUBLISHED' | 'ADMIN_ADJUSTMENT' | 'DISPUTE_LOSS' | 'POLICY_VIOLATION',
  reason:   string,
  adminId?: string,
): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return 0;

  const newScore = Math.min(100, Math.max(0, user.trustScore + delta));

  await prisma.trustEvent.create({
    data: {
      userId,
      delta,
      reason,
      category,
      adminId: adminId ?? undefined,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data:  { trustScore: newScore },
  });

  console.log(
    `[TRUST ENGINE] (${category}) User ${userId}: ${delta >= 0 ? '+' : ''}${delta} trust` +
    ` -> ${newScore}. Reason: "${reason}"`,
  );

  return newScore;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export class TrustEngine {
  /** Called when a freelance job reaches COMPLETED status. */
  static async onJobComplete(userId: string): Promise<void> {
    await applyTrustDelta(userId, TRUST_DELTA.JOB_COMPLETE, 'JOB_COMPLETE', 'Job completed successfully');
  }

  /** Called when an escrow is released on a completed milestone. */
  static async onEscrowComplete(userId: string): Promise<void> {
    await applyTrustDelta(userId, TRUST_DELTA.ESCROW_COMPLETE, 'ESCROW_COMPLETE', 'Escrow released successfully');
  }

  /** Called when a 5-star review is received. */
  static async onPositiveReview(userId: string): Promise<void> {
    await applyTrustDelta(userId, TRUST_DELTA.POSITIVE_REVIEW, 'POSITIVE_REVIEW', 'Positive review received');
  }

  /** Called when a creator publishes approved content. */
  static async onContentPublished(userId: string): Promise<void> {
    await applyTrustDelta(userId, TRUST_DELTA.CONTENT_PUBLISHED, 'CONTENT_PUBLISHED', 'Content published on platform');
  }

  /** Called when an admin resolves a dispute and this user was at fault. */
  static async onDisputeLoss(userId: string, disputeId: string): Promise<void> {
    await applyTrustDelta(
      userId,
      TRUST_DELTA.DISPUTE_LOSS,
      'DISPUTE_LOSS',
      `Dispute ${disputeId} resolved against user`,
    );
  }

  /** Called when a policy violation impacts reputation (POLICY_VIOLATION trust category). */
  static async onPolicyViolation(userId: string, category: string): Promise<void> {
    await applyTrustDelta(
      userId,
      TRUST_DELTA.POLICY_VIOLATION,
      'POLICY_VIOLATION',
      `Policy violation recorded: ${category}`,
    );
  }

  /**
   * Admin manual trust adjustment — up or down.
   * Full audit trail via TrustEvent.
   */
  static async adjustManually(
    userId:  string,
    delta:   number,
    reason:  string,
    adminId: string,
  ): Promise<number> {
    return applyTrustDelta(userId, delta, 'ADMIN_ADJUSTMENT', reason, adminId);
  }
}

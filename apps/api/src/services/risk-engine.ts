/**
 * RiskEngine v2
 *
 * Three independent concerns, cleanly separated:
 *
 *  addSecuritySignal   — anti-fraud / anti-Sybil signals (phone reuse, bots, etc.)
 *  addPolicyViolation  — moderation actions (spam, harassment, fake listings, etc.)
 *  checkTimerViolation — stake-timer early-unstake with 1-strike grace period
 *  decayRisk           — automatic -10 per 30 clean days, called passively on login
 *  adjustManually      — admin score correction with full audit trail
 *
 * All changes are written to RiskEvent (immutable audit trail).
 * Auto-suspension is REMOVED. Accounts reaching >= 81 are flagged needsReview=true
 * and require explicit admin action.
 */

import { prisma } from '../lib/prisma.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const HIGH_RISK_THRESHOLD = 81;
const DECAY_AMOUNT        = 10;                    // points recovered per clean 30-day period
const DECAY_PERIOD_MS     = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

/**
 * Security risk points applied when a policy violation also crosses into
 * confirmed fraud / identity abuse. Other categories get 0 security points.
 */
const POLICY_SECURITY_IMPACT: Record<string, number> = {
  SPAM:            0,
  HARASSMENT:      0,
  FAKE_LISTING:   10,
  COPYRIGHT_ABUSE: 0,
  FAKE_IDENTITY:  25,
  PLATFORM_ABUSE: 20,
};

// ── Internal helper ───────────────────────────────────────────────────────────

async function applySecurityDelta(
  userId: string,
  delta: number,
  reason: string,
  category: 'SECURITY' | 'POLICY' | 'MANUAL' | 'DECAY',
  metadata?: Record<string, any>,
  adminId?: string,
): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return 0;

  const newScore      = Math.min(100, Math.max(0, user.riskScore + delta));
  const flagForReview = newScore >= HIGH_RISK_THRESHOLD && !user.needsReview;

  // Write immutable RiskEvent
  await prisma.riskEvent.create({
    data: {
      userId,
      delta,
      reason,
      category,
      metadata:  metadata  ?? undefined,
      adminId:   adminId   ?? undefined,
    },
  });

  // Update user — never change status automatically
  await prisma.user.update({
    where: { id: userId },
    data: {
      riskScore:       newScore,
      lastViolationAt: delta > 0 ? new Date() : undefined,
      needsReview:     flagForReview ? true : undefined,
    },
  });

  if (flagForReview) {
    console.warn(
      `[RISK ENGINE] User ${userId} reached risk score ${newScore}` +
      ` — flagged needsReview=true. Admin action required.`,
    );
  }

  console.log(
    `[RISK ENGINE] (${category}) User ${userId}: ${delta >= 0 ? '+' : ''}${delta} risk` +
    ` -> ${newScore}. Reason: "${reason}"`,
  );

  return newScore;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export class RiskEngine {
  /**
   * Record an anti-fraud / anti-Sybil SECURITY signal.
   * Increments riskScore and writes an immutable RiskEvent.
   * Never auto-suspends — admin must act if score >= 81.
   */
  static async addSecuritySignal(
    userId:   string,
    signal:   string,
    delta:    number,
    metadata?: Record<string, any>,
  ): Promise<number> {
    return applySecurityDelta(userId, Math.abs(delta), signal, 'SECURITY', metadata);
  }

  /**
   * Record a policy / moderation violation with a standardised category.
   * Creates a PolicyViolation record. Only FAKE_IDENTITY / PLATFORM_ABUSE /
   * FAKE_LISTING also increment security risk.
   */
  static async addPolicyViolation(
    userId:     string,
    category:   'SPAM' | 'HARASSMENT' | 'FAKE_LISTING' | 'COPYRIGHT_ABUSE' | 'FAKE_IDENTITY' | 'PLATFORM_ABUSE',
    adminId:    string,
    details?:   string,
    contentId?: string,
  ): Promise<{ violationId: string; securityRiskAdded: number }> {
    const violation = await prisma.policyViolation.create({
      data: {
        userId,
        category,
        details:   details   ?? undefined,
        contentId: contentId ?? undefined,
        adminId,
      },
    });

    const securityDelta = POLICY_SECURITY_IMPACT[category] ?? 0;
    let newRisk = 0;

    if (securityDelta > 0) {
      newRisk = await applySecurityDelta(
        userId,
        securityDelta,
        `Policy violation: ${category}`,
        'POLICY',
        { violationId: violation.id, category },
        adminId,
      );
    }

    console.log(
      `[RISK ENGINE] Policy violation (${category}) by admin ${adminId}` +
      ` for user ${userId}. Security risk added: +${securityDelta}`,
    );

    return { violationId: violation.id, securityRiskAdded: securityDelta };
  }

  /**
   * Handle a read-stake timer violation with grace period:
   *   - 1st strike  → warning only (timerViolationCount++)
   *   - 2nd+ strike → +15 security risk
   */
  static async checkTimerViolation(
    userId:     string,
    contentId:  string,
    elapsedSec: number,
  ): Promise<{ warned: boolean; riskAdded: number; newRiskScore: number }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { warned: false, riskAdded: 0, newRiskScore: 0 };

    const newCount = user.timerViolationCount + 1;
    await prisma.user.update({
      where: { id: userId },
      data:  { timerViolationCount: newCount },
    });

    if (newCount === 1) {
      // First offence — grace period, warning only
      console.log(
        `[RISK ENGINE] Timer violation #1 for user ${userId}` +
        ` (${elapsedSec}s elapsed). Warning issued — no risk change.`,
      );
      return { warned: true, riskAdded: 0, newRiskScore: user.riskScore };
    }

    // Second or subsequent offence
    const newScore = await applySecurityDelta(
      userId,
      15,
      `Early read-stake unstake (strike ${newCount}) — only ${elapsedSec}s elapsed`,
      'SECURITY',
      { contentId, elapsedSec, strike: newCount },
    );

    return { warned: false, riskAdded: 15, newRiskScore: newScore };
  }

  /**
   * Passively decay security risk for users with a 30-day clean record.
   * Reduces riskScore by 10 (DECAY_AMOUNT). Called non-blocking on login.
   */
  static async decayRisk(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.riskScore <= 0) return;

      const now               = Date.now();
      const lastViolation     = user.lastViolationAt ? new Date(user.lastViolationAt).getTime() : 0;
      const msSinceViolation  = now - lastViolation;
      const eligibleForDecay  = msSinceViolation >= DECAY_PERIOD_MS || !user.lastViolationAt;

      if (!eligibleForDecay) return;

      const newScore  = Math.max(0, user.riskScore - DECAY_AMOUNT);
      const actualDec = user.riskScore - newScore;

      await prisma.riskEvent.create({
        data: {
          userId,
          delta:    -actualDec,
          reason:   '30-day clean period — automatic recovery',
          category: 'DECAY',
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          riskScore:   newScore,
          needsReview: newScore < HIGH_RISK_THRESHOLD ? false : undefined,
        },
      });

      console.log(`[RISK ENGINE] Decay: User ${userId} riskScore ${user.riskScore} -> ${newScore}`);
    } catch (err) {
      // Non-blocking — login must never fail due to decay errors
      console.error('[RISK ENGINE] Decay error (non-fatal):', err);
    }
  }

  /**
   * Admin manual risk adjustment (up or down) with full audit trail.
   */
  static async adjustManually(
    userId:  string,
    delta:   number,
    reason:  string,
    adminId: string,
  ): Promise<number> {
    return applySecurityDelta(userId, delta, reason, 'MANUAL', { adminId }, adminId);
  }
}

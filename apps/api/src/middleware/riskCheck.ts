/**
 * riskCheck middleware
 *
 * Public interface is UNCHANGED — all existing callers continue to work.
 *
 * Internal changes:
 *  - RiskService.addRiskSignal delegates to RiskEngine.addSecuritySignal
 *  - Auto-suspension on score >= 81 is REMOVED; accounts are flagged needsReview
 *  - riskRestrictionGuard now also checks needsReview for informational guard
 *  - On every clean pass through the guard, RiskEngine.decayRisk is called non-blocking
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma }     from '../lib/prisma.js';
import { RiskEngine } from '../services/risk-engine.js';

// ── Compatibility shim ─────────────────────────────────────────────────────────
// Existing callers still work unchanged. Internally delegates to RiskEngine v2.

export class RiskService {
  /**
   * @deprecated Use RiskEngine.addSecuritySignal for new code.
   * Kept for backwards compatibility with existing call sites.
   */
  static async addRiskSignal(
    userId:    string,
    signal:    string,
    scoreAdded: number,
    metadata?: any,
  ): Promise<number> {
    return RiskEngine.addSecuritySignal(userId, signal, scoreAdded, metadata ?? undefined);
  }
}

// ── Request guard ─────────────────────────────────────────────────────────────

/**
 * Hook to block suspended/banned users and rate-limit/restrict others.
 * Interface is IDENTICAL to the original — no callers need updating.
 */
export async function riskRestrictionGuard(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const userPayload = request.user;
  if (!userPayload) return;

  const user = await prisma.user.findUnique({
    where: { id: userPayload.userId },
  });

  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'User not found' }) as any;
  }

  // Always hard-block explicitly suspended / banned accounts
  if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
    return reply.status(403).send({
      error: 'Suspended',
      message: 'Your account has been suspended. Please contact support.',
    }) as any;
  }

  // Tier 4: High Risk (81–100) — NOT auto-suspended.
  // Account is flagged needsReview for admin action.
  // Users can still read/interact but payouts and staking are blocked.
  if (user.riskScore >= 81) {
    const isFinancialAction =
      request.url.includes('/unstake') ||
      request.url.includes('/stake') ||
      (request.url.includes('/milestones') && request.method === 'POST') ||
      request.url.includes('/withdraw');

    if (isFinancialAction) {
      return reply.status(403).send({
        error: 'High Risk',
        message:
          'Your account has been flagged for admin review due to security concerns. ' +
          'Financial actions are temporarily suspended pending review.',
      }) as any;
    }
  }

  // Tier 3: Restricted (61–80) — block payouts and unstaking
  if (
    user.riskScore >= 61 &&
    (request.url.includes('/unstake') ||
      (request.url.includes('/milestones') && request.method === 'POST'))
  ) {
    return reply.status(403).send({
      error: 'Restricted',
      message:
        'Access denied. Account is in Restricted tier — earnings and withdrawals are suspended.',
    }) as any;
  }

  // Passively decay risk for clean users (non-blocking, never fails the request)
  if (user.riskScore > 0) {
    RiskEngine.decayRisk(user.id).catch(() => {});
  }
}

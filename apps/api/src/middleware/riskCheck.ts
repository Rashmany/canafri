import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

export class RiskService {
  /**
   * Records a risk signal for a user, adds the score, and logs it.
   */
  static async addRiskSignal(
    userId: string,
    signal: string,
    scoreAdded: number,
    metadata?: any
  ): Promise<number> {
    // 1. Create RiskFlag record
    await prisma.riskFlag.create({
      data: {
        userId,
        signal,
        severity: scoreAdded,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });

    // 2. Fetch user to recalculate score
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return 0;

    const newRiskScore = Math.min(100, user.riskScore + scoreAdded);
    
    // Adjust trustScore downwards as riskScore goes up (trustScore = 100 - riskScore/2)
    const newTrustScore = Math.max(0, 100 - Math.floor(newRiskScore / 2));

    let newStatus = user.status;
    if (newRiskScore >= 81) {
      newStatus = 'SUSPENDED'; // Automatically suspend if blocked threshold reached
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        riskScore: newRiskScore,
        trustScore: newTrustScore,
        status: newStatus,
      },
    });

    console.log(`[RISK SIGNAL] User ${userId} flagged: ${signal} (+${scoreAdded} risk). New Score: ${newRiskScore}, Status: ${newStatus}`);
    return newRiskScore;
  }
}

/**
 * Hook to block suspended/banned users and rate-limit/restrict others based on risk score.
 */
export async function riskRestrictionGuard(request: FastifyRequest, reply: FastifyReply) {
  const userPayload = request.user;
  if (!userPayload) return;

  const user = await prisma.user.findUnique({
    where: { id: userPayload.userId },
  });

  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'User not found' });
  }

  // Tier 4: Blocked (81 to 100) -> Suspend
  if (user.status === 'SUSPENDED' || user.status === 'BANNED' || user.riskScore >= 81) {
    return reply.status(403).send({
      error: 'Suspended',
      message: 'Your account is suspended due to security risk violations.',
    });
  }

  // Tier 3: Restricted (61 to 80) -> Suspends earnings/payouts
  if (user.riskScore >= 61 && request.url.includes('/unstake') || request.url.includes('/milestones') && request.method === 'POST') {
    return reply.status(403).send({
      error: 'Restricted',
      message: 'Access denied. Account is in Restricted tier (earnings and withdrawals suspended).',
    });
  }
}

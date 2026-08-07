import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

export class AdminAnalyticsService {
  /**
   * Buyer stats summary cached in Redis for 60s
   */
  static async getBuyerStats() {
    const cacheKey = 'admin:buyers:stats';
    const cached = await redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* rebuild */ }
    }

    const [totalBuyers, activeBuyers, escrowJobs, completedJobs] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'ACTIVE' } }),
      prisma.job.aggregate({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'DISPUTED'] } },
        _sum: { amountCC: true },
        _count: { id: true },
      }),
      prisma.job.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amountCC: true },
        _count: { id: true },
      }),
    ]);

    const stats = {
      totalBuyers,
      activeBuyers,
      totalJobsPosted: (escrowJobs._count.id || 0) + (completedJobs._count.id || 0),
      totalEscrowCC: escrowJobs._sum.amountCC || 0,
      totalSpentCC: completedJobs._sum.amountCC || 0,
    };

    await redis.set(cacheKey, JSON.stringify(stats), { EX: 60 });
    return stats;
  }

  /**
   * Seller stats summary cached in Redis for 60s
   */
  static async getSellerStats() {
    const cacheKey = 'admin:sellers:stats';
    const cached = await redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* rebuild */ }
    }

    const [totalSellers, activeSellers, verifiedSellers, completedJobs] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER', isSeller: true } }),
      prisma.user.count({ where: { role: 'MEMBER', isSeller: true, status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'MEMBER', isSeller: true, sellerApproved: true } }),
      prisma.job.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amountCC: true },
      }),
    ]);

    const stats = {
      totalSellers,
      activeSellers,
      verifiedSellers,
      totalSalesCC: completedJobs._sum.amountCC || 0,
    };

    await redis.set(cacheKey, JSON.stringify(stats), { EX: 60 });
    return stats;
  }

  /**
   * Creator stats summary cached in Redis for 60s
   */
  static async getCreatorStats() {
    const cacheKey = 'admin:creators:stats';
    const cached = await redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* rebuild */ }
    }

    const [totalCreators, activeCreators, publishedContent, totalStakes] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER', isCreator: true } }),
      prisma.user.count({ where: { role: 'MEMBER', isCreator: true, status: 'ACTIVE' } }),
      prisma.content.count({ where: { status: 'LIVE' } }),
      prisma.creatorStake.aggregate({
        _sum: { amountCC: true },
      }),
    ]);

    const stats = {
      totalCreators,
      activeCreators,
      publishedContent,
      totalStakedCC: totalStakes._sum.amountCC || 0,
    };

    await redis.set(cacheKey, JSON.stringify(stats), { EX: 60 });
    return stats;
  }

  /**
   * Immediate cache invalidation after admin mutation
   */
  static async invalidate(type: 'buyers' | 'sellers' | 'creators' | 'all') {
    if (type === 'all') {
      await Promise.all([
        redis.del('admin:buyers:stats'),
        redis.del('admin:sellers:stats'),
        redis.del('admin:creators:stats'),
      ]);
    } else {
      await redis.del(`admin:${type}:stats`);
    }
  }
}

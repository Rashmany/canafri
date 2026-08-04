import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard, roleGuard } from '../middleware/auth.js';
import { HashService } from '../lib/hash.js';
import { AuditService } from '../services/audit.js';
import { CantonService } from '../services/canton.js';
import { RiskService } from '../middleware/riskCheck.js';
import { NotificationService } from '../services/notification.js';
import { getPlatformConfig, getFullPlatformConfig, updatePlatformConfig } from '../services/platform-config.js';

const SuspendUserSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
  reason: z.string().optional(),
});

const UpdateUserFlagsSchema = z.object({
  isCreator: z.boolean().optional(),
  isSeller: z.boolean().optional(),
  sellerApproved: z.boolean().optional(),
});

const UpdateSellerSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  sellerApproved: z.boolean().optional(),
});

const UpdateUserScoresSchema = z.object({
  trustScore: z.number().int().min(0).max(100).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
});

const WarnUserSchema = z.object({
  warning: z.string().min(2).max(500).trim(),
});

const InviteCreateSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN']),
});

const AcceptInviteSchema = z.object({
  fullName:  z.string().min(2).max(80).trim(),
  username:  z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).trim(),
  password:  z.string().min(8),
});

const RoleUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN']),
});

const RevokeAdminSchema = z.object({
  reason: z.string().min(1).max(500).trim(),
});

const ContentApproveSchema = z.object({
  status: z.enum(['LIVE', 'REJECTED', 'DELISTED']),
  adminNote: z.string().optional(),
});

const ResolveDisputeSchema = z.object({
  clientPct: z.number().min(0).max(1),
  freelancerPct: z.number().min(0).max(1),
  resolution: z.string().min(5),
});

const WithdrawalRequestSchema = z.object({
  amountCC: z.number().positive(),
  destinationWallet: z.string().min(10),
});

/** Economics / Governance fields (any ADMIN level) */
const UpdateEconomicsSchema = z.object({
  subscriptionAmountCC: z.number().positive().optional(),
  poolAllocationCC: z.number().positive().optional(),
  stakeBalanceCC: z.number().positive().optional(),
  platformFeeSub: z.number().min(0).max(1).optional(),
  platformFeeFreelance: z.number().min(0).max(1).optional(),
  readStakeAmountCC: z.number().positive().optional(),
  minReadTimeSeconds: z.number().int().positive().optional(),
  gracePeriodHours: z.number().int().positive().optional(),
  creatorStakeCC: z.number().positive().optional(),
  creatorLockDays: z.number().int().positive().optional(),
  maxContentPerMonth: z.number().int().positive().optional(),
  dailyCheckinCC: z.number().positive().optional(),
  proposalDepositCC: z.number().positive().optional(),
  minTreasuryReserveCC: z.number().positive().optional(),
  incentivePhaseActive: z.boolean().optional(),
});

/** Full Platform Control Center schema (SUPER_ADMIN only) */
const UpdateConfigSchema = UpdateEconomicsSchema.extend({
  // Service maintenance flags & reasons
  globalMaintenance: z.boolean().optional(),
  globalMaintenanceReason: z.string().max(500).optional(),
  freelancingMaintenance: z.boolean().optional(),
  freelancingMaintenanceReason: z.string().max(500).optional(),
  contentMaintenance: z.boolean().optional(),
  contentMaintenanceReason: z.string().max(500).optional(),
  messagingMaintenance: z.boolean().optional(),
  messagingMaintenanceReason: z.string().max(500).optional(),
  registrationPaused: z.boolean().optional(),
  registrationPausedReason: z.string().max(500).optional(),
  loginPaused: z.boolean().optional(),
  loginPausedReason: z.string().max(500).optional(),
  // Financial emergency controls
  walletPaused: z.boolean().optional(),
  walletPausedReason: z.string().max(500).optional(),
  depositPaused: z.boolean().optional(),
  depositPausedReason: z.string().max(500).optional(),
  withdrawPaused: z.boolean().optional(),
  withdrawPausedReason: z.string().max(500).optional(),
  escrowCreatePaused: z.boolean().optional(),
  escrowCreatePausedReason: z.string().max(500).optional(),
  escrowReleasePaused: z.boolean().optional(),
  escrowReleasePausedReason: z.string().max(500).optional(),
  otcTradingPaused: z.boolean().optional(),
  otcTradingPausedReason: z.string().max(500).optional(),
  // System controls
  creatorPaused: z.boolean().optional(),
  creatorPausedReason: z.string().max(500).optional(),
  notificationsPaused: z.boolean().optional(),
  emailSendingPaused: z.boolean().optional(),
  smsVerificationPaused: z.boolean().optional(),
  // Country access control (array of ISO 3166-1 alpha-2 codes)
  restrictedCountries: z.array(z.string().length(2).toUpperCase()).optional(),
  // Scheduled maintenance banner
  bannerEnabled: z.boolean().optional(),
  bannerTitle: z.string().max(100).optional(),
  bannerMessage: z.string().max(1000).optional(),
  bannerStart: z.string().datetime().optional().nullable(),
  bannerEnd: z.string().datetime().optional().nullable(),
  bannerDismissible: z.boolean().optional(),
});

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require ADMIN or SUPER_ADMIN roles
  fastify.addHook('preValidation', authGuard);
  fastify.addHook('preHandler', roleGuard(['ADMIN', 'SUPER_ADMIN']));

  // GET /admin/me — lightweight heartbeat endpoint used by the frontend to
  // detect revoked sessions and force-logout the browser tab.
  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = request.user as any;
      // Fetch live status from DB so a freshly-revoked admin gets 403 here
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true, role: true } });
      if (!user || user.status === 'REVOKED' || user.status === 'BANNED') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Account access has been revoked.' });
      }
      return reply.send({ ok: true, role, userId });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/dashboard-stats — Real live platform KPI metrics & system overview
  fastify.get('/dashboard-stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        creatorsCount,
        sellersCount,
        buyersCount,
        suspendedCount,
        bannedCount,
        activeJobsCount,
        disputesCount,
        pendingContentCount,
        riskFlagsCount,
        sellerApplicationsCount,
        jobsCompletedCount,
        jobsPostedCount,
        contentPublishedCount,
        delistedContentCount,
        totalJobsCC,
        totalSubsCC,
        totalStakesCC,
        recentLogs,
        recentUsers,
        recentContent,
        recentJobs,
        recentSubscriptions,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'MEMBER' } }),
        prisma.user.count({ where: { role: 'MEMBER', isCreator: true } }),
        prisma.user.count({ where: { role: 'MEMBER', isSeller: true, sellerApproved: true } }),
        prisma.user.count({ where: { role: 'MEMBER', phoneVerified: true, postedJobs: { some: {} } } }),
        prisma.user.count({ where: { role: 'MEMBER', status: 'SUSPENDED' } }),
        prisma.user.count({ where: { role: 'MEMBER', status: 'BANNED' } }),
        prisma.job.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        prisma.job.count({ where: { status: 'DISPUTED' } }),
        prisma.content.count({ where: { status: 'PENDING' } }),
        prisma.riskFlag.count(),
        prisma.user.count({ where: { sellerApplied: true, sellerApproved: false } }),
        prisma.job.count({ where: { status: 'COMPLETED' } }),
        prisma.job.count(),
        prisma.content.count({ where: { status: 'LIVE' } }),
        prisma.content.count({ where: { status: 'DELISTED' } }),
        prisma.job.aggregate({ _sum: { amountCC: true } }),
        prisma.subscription.aggregate({ _sum: { amountCC: true } }),
        prisma.creatorStake.aggregate({ _sum: { amountCC: true } }),
        prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true, isCreator: true }
        }),
        prisma.content.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true, publishedAt: true, status: true }
        }),
        prisma.job.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true, updatedAt: true, status: true, amountCC: true, platformFee: true }
        }),
        prisma.subscription.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true, amountCC: true }
        }),
      ]);

      const totalWalletBalance = (totalJobsCC._sum.amountCC ?? 0) + (totalSubsCC._sum.amountCC ?? 0) + (totalStakesCC._sum.amountCC ?? 0);
      
      // Aggregate daily registrations for the past 7 days
      const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daysList: string[] = [];
      const dailyTrendMap: Record<string, { users: number; creators: number }> = {};
      const activityMetricsMap: Record<string, Record<string, number>> = {};
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayLabel = daysMap[d.getDay()];
        daysList.push(dayLabel);
        dailyTrendMap[dayLabel] = { users: 0, creators: 0 };
        activityMetricsMap[dayLabel] = {
          'Jobs Posted': 0,
          'Jobs Completed': 0,
          'Content Published': 0,
          'CC Spent': 0,
          'CC Deposited': 0,
          'CC Withdrawn': 0,
          'Platform CC Earned': 0,
        };
      }

      for (const u of recentUsers) {
        const dayLabel = daysMap[new Date(u.createdAt).getDay()];
        if (dailyTrendMap[dayLabel]) {
          dailyTrendMap[dayLabel].users += 1;
          if (u.isCreator) dailyTrendMap[dayLabel].creators += 1;
        }
      }

      for (const c of recentContent) {
        const pubDate = c.publishedAt || c.createdAt;
        const dayLabel = daysMap[new Date(pubDate).getDay()];
        if (activityMetricsMap[dayLabel]) {
          activityMetricsMap[dayLabel]['Content Published'] += 1;
        }
      }

      for (const j of recentJobs) {
        const createLabel = daysMap[new Date(j.createdAt).getDay()];
        if (activityMetricsMap[createLabel]) {
          activityMetricsMap[createLabel]['Jobs Posted'] += 1;
          activityMetricsMap[createLabel]['CC Spent'] += (j.amountCC || 0);
        }
        if (j.status === 'COMPLETED') {
          const completeLabel = daysMap[new Date(j.updatedAt).getDay()];
          if (activityMetricsMap[completeLabel]) {
            activityMetricsMap[completeLabel]['Jobs Completed'] += 1;
            activityMetricsMap[completeLabel]['CC Withdrawn'] += (j.amountCC || 0);
            activityMetricsMap[completeLabel]['Platform CC Earned'] += (j.amountCC || 0) * (j.platformFee || 0.05);
          }
        }
      }

      for (const s of recentSubscriptions) {
        const dayLabel = daysMap[new Date(s.createdAt).getDay()];
        if (activityMetricsMap[dayLabel]) {
          activityMetricsMap[dayLabel]['CC Deposited'] += (s.amountCC || 0);
        }
      }

      const registrationTrendDaily = Object.entries(dailyTrendMap).map(([day, counts]) => ({
        day,
        users: counts.users,
        creators: counts.creators,
      }));

      // ── Build Weekly buckets (last 4 weeks) ──────────────────────────────
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const weekLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
      const weeklyMap: Record<string, Record<string, number>> = {};
      for (const wl of weekLabels) {
        weeklyMap[wl] = { 'Jobs Posted': 0, 'Jobs Completed': 0, 'Content Published': 0, 'CC Spent': 0, 'CC Deposited': 0, 'CC Withdrawn': 0, 'Platform CC Earned': 0 };
      }

      const getWeekLabel = (date: Date): string | null => {
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        if (diffDays < 0 || diffDays >= 28) return null;
        const weekIdx = 3 - Math.floor(diffDays / 7);
        return weekLabels[weekIdx] || null;
      };

      const [weeklyContent, weeklyJobs, weeklySubscriptions] = await Promise.all([
        prisma.content.findMany({
          where: { createdAt: { gte: fourWeeksAgo } },
          select: { createdAt: true, publishedAt: true }
        }),
        prisma.job.findMany({
          where: { createdAt: { gte: fourWeeksAgo } },
          select: { createdAt: true, updatedAt: true, status: true, amountCC: true, platformFee: true }
        }),
        prisma.subscription.findMany({
          where: { createdAt: { gte: fourWeeksAgo } },
          select: { createdAt: true, amountCC: true }
        }),
      ]);

      for (const c of weeklyContent) {
        const wl = getWeekLabel(new Date(c.publishedAt || c.createdAt));
        if (wl) weeklyMap[wl]['Content Published'] += 1;
      }
      for (const j of weeklyJobs) {
        const wl = getWeekLabel(new Date(j.createdAt));
        if (wl) { weeklyMap[wl]['Jobs Posted'] += 1; weeklyMap[wl]['CC Spent'] += (j.amountCC || 0); }
        if (j.status === 'COMPLETED') {
          const wlC = getWeekLabel(new Date(j.updatedAt));
          if (wlC) {
            weeklyMap[wlC]['Jobs Completed'] += 1;
            weeklyMap[wlC]['CC Withdrawn'] += (j.amountCC || 0);
            weeklyMap[wlC]['Platform CC Earned'] += (j.amountCC || 0) * (j.platformFee || 0.05);
          }
        }
      }
      for (const s of weeklySubscriptions) {
        const wl = getWeekLabel(new Date(s.createdAt));
        if (wl) weeklyMap[wl]['CC Deposited'] += (s.amountCC || 0);
      }

      // ── Build Monthly buckets (last 12 months) ───────────────────────────
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const monthLabels: string[] = [];
      const monthlyMap: Record<string, Record<string, number>> = {};
      const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ml = shortMonths[d.getMonth()];
        monthLabels.push(ml);
        monthlyMap[ml] = { 'Jobs Posted': 0, 'Jobs Completed': 0, 'Content Published': 0, 'CC Spent': 0, 'CC Deposited': 0, 'CC Withdrawn': 0, 'Platform CC Earned': 0 };
      }

      const getMonthLabel = (date: Date): string | null => {
        const ml = shortMonths[date.getMonth()];
        return monthlyMap[ml] !== undefined ? ml : null;
      };

      const [monthlyContent, monthlyJobs, monthlySubscriptions] = await Promise.all([
        prisma.content.findMany({
          where: { createdAt: { gte: twelveMonthsAgo } },
          select: { createdAt: true, publishedAt: true }
        }),
        prisma.job.findMany({
          where: { createdAt: { gte: twelveMonthsAgo } },
          select: { createdAt: true, updatedAt: true, status: true, amountCC: true, platformFee: true }
        }),
        prisma.subscription.findMany({
          where: { createdAt: { gte: twelveMonthsAgo } },
          select: { createdAt: true, amountCC: true }
        }),
      ]);

      for (const c of monthlyContent) {
        const ml = getMonthLabel(new Date(c.publishedAt || c.createdAt));
        if (ml) monthlyMap[ml]['Content Published'] += 1;
      }
      for (const j of monthlyJobs) {
        const ml = getMonthLabel(new Date(j.createdAt));
        if (ml) { monthlyMap[ml]['Jobs Posted'] += 1; monthlyMap[ml]['CC Spent'] += (j.amountCC || 0); }
        if (j.status === 'COMPLETED') {
          const mlC = getMonthLabel(new Date(j.updatedAt));
          if (mlC) {
            monthlyMap[mlC]['Jobs Completed'] += 1;
            monthlyMap[mlC]['CC Withdrawn'] += (j.amountCC || 0);
            monthlyMap[mlC]['Platform CC Earned'] += (j.amountCC || 0) * (j.platformFee || 0.05);
          }
        }
      }
      for (const s of monthlySubscriptions) {
        const ml = getMonthLabel(new Date(s.createdAt));
        if (ml) monthlyMap[ml]['CC Deposited'] += (s.amountCC || 0);
      }

      // ── Assemble realActivityMetrics with all 3 periods ──────────────────
      const METRIC_KEYS = ['Jobs Posted', 'Jobs Completed', 'Content Published', 'CC Spent', 'CC Deposited', 'CC Withdrawn', 'Platform CC Earned'] as const;
      type MetricKey = typeof METRIC_KEYS[number];

      const realActivityMetrics: Record<MetricKey, { Daily: Array<{ label: string; value: number }>; Weekly: Array<{ label: string; value: number }>; Monthly: Array<{ label: string; value: number }> }> = {} as any;

      for (const key of METRIC_KEYS) {
        realActivityMetrics[key] = {
          Daily:   daysList.map(day => ({ label: day, value: Math.round(activityMetricsMap[day][key]) })),
          Weekly:  weekLabels.map(wl => ({ label: wl, value: Math.round(weeklyMap[wl][key]) })),
          Monthly: monthLabels.map(ml => ({ label: ml, value: Math.round(monthlyMap[ml][key]) })),
        };
      }

      const operatorIds = Array.from(new Set(recentLogs.map(l => l.adminId || l.userId).filter(Boolean))) as string[];
      const operators = operatorIds.length > 0 ? await prisma.user.findMany({
        where: { id: { in: operatorIds } },
        select: { id: true, displayName: true, username: true, role: true },
      }) : [];
      const operatorMap = new Map(operators.map(op => [op.id, op]));

      const enrichedLogs = recentLogs.map(l => {
        const opId = l.adminId || l.userId;
        const op = opId ? operatorMap.get(opId) : null;
        return {
          ...l,
          admin: op ? {
            displayName: op.displayName,
            username: op.username,
            role: op.role,
          } : null,
        };
      });

      return reply.send({
        success: true,
        stats: {
          totalUsers,
          creatorsCount,
          sellersCount,
          buyersCount,
          suspendedCount,
          bannedCount,
          activeJobsCount,
          disputesCount,
          pendingContentCount,
          riskFlagsCount,
          sellerApplicationsCount,
          jobsCompletedCount,
          jobsPostedCount,
          contentPublishedCount,
          delistedContentCount,
          totalWalletBalance,
        },
        registrationTrendDaily,
        activityMetrics: realActivityMetrics,
        recentLogs: enrichedLogs,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/sellers — List all sellers and calculate sellers overview statistics
  fastify.get('/sellers', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const sellers = await prisma.user.findMany({
        where: { role: 'MEMBER', isSeller: true },
        include: {
          creatorStake: true,
          freelanceJobs: {
            select: { id: true, status: true, amountCC: true }
          },
          riskFlags: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const totalSellers    = sellers.length;
      const activeSellers   = sellers.filter(s => s.status === 'ACTIVE').length;
      const verifiedSellers = sellers.filter(s => s.sellerApproved).length;
      let totalSalesCC = 0;
      for (const s of sellers) {
        for (const j of s.freelanceJobs) {
          if (j.status === 'COMPLETED') totalSalesCC += j.amountCC ?? 0;
        }
      }

      return reply.send({
        success: true,
        sellers,
        stats: {
          totalSellers,
          activeSellers,
          verifiedSellers,
          totalSalesCC,
        }
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /admin/sellers/:id/status — Suspend, verify, or update seller status
  fastify.patch('/sellers/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { status, sellerApproved } = UpdateSellerSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user || !user.isSeller) {
        return reply.status(404).send({ error: 'Not Found', message: 'Seller profile not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(status ? { status: status as any } : {}),
          ...(sellerApproved !== undefined ? { sellerApproved } : {}),
        }
      });

      await AuditService.log({
        adminId: (request.user as any).userId ?? (request.user as any).sub,
        userId: id,
        action: 'UPDATE_SELLER_STATUS',
        target: id,
        before: { status: user.status, sellerApproved: user.sellerApproved },
        after: { status: updatedUser.status, sellerApproved: updatedUser.sellerApproved },
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, seller: updatedUser });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/seller-applications — List only users who submitted the seller application form
  fastify.get('/seller-applications', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const applicants = await prisma.user.findMany({
        where: { sellerApplied: true },
        select: {
          id: true,
          displayName: true,
          username: true,
          email: true,
          country: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
          phoneVerified: true,
          walletAddress: true,
          trustScore: true,
          riskScore: true,
          isSeller: true,
          sellerApplied: true,
          sellerApproved: true,
          creatorStake: true,
          riskFlags: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const userIds = applicants.map(a => a.id);
      const notifications = await prisma.notification.findMany({
        where: { userId: { in: userIds }, type: 'SELLER_APPLICATION' },
        orderBy: { createdAt: 'desc' },
      });

      const notifMap = new Map<string, any>();
      for (const n of notifications) {
        if (!notifMap.has(n.userId)) {
          notifMap.set(n.userId, n);
        }
      }

      const applicantsWithNotifs = applicants.map(a => ({
        ...a,
        notifications: notifMap.has(a.id) ? [notifMap.get(a.id)] : [],
      }));

      return reply.send({ success: true, applicants: applicantsWithNotifs });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /admin/seller-applications/:id/approve — Approve or reject seller application
  fastify.post('/seller-applications/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { approved, note } = z.object({ approved: z.boolean(), note: z.string().optional() }).parse(request.body);

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          isSeller: approved,
          sellerApproved: approved,
          sellerApplied: approved ? true : false,
        },
      });

      await AuditService.log({
        adminId: (request.user as any)?.userId ?? (request.user as any)?.sub ?? 'admin',
        userId: id,
        action: approved ? 'APPROVE_SELLER_APPLICATION' : 'REJECT_SELLER_APPLICATION',
        target: `user:${id}`,
        before: { isSeller: user.isSeller, sellerApproved: user.sellerApproved },
        after: { isSeller: updatedUser.isSeller, sellerApproved: updatedUser.sellerApproved, note },
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      // Send real-time notification to the user
      await NotificationService.send({
        userId: id,
        title: approved ? 'Seller Application Approved' : 'Seller Application Update',
        body: approved
          ? 'Congratulations! Your seller application has been approved. You can now toggle Seller Mode in your sidebar.'
          : (note || 'Your seller application was reviewed and was not approved at this time.'),
        type: approved ? 'SELLER_APPROVED' : 'SELLER_REJECTED',
        category: 'ACCOUNT',
        link: approved ? '/dashboard' : '/become-seller',
      });

      return reply.send({ success: true, user: updatedUser });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
  // GET /admin/users — List all registered members with buyer/seller signals
  fastify.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await prisma.user.findMany({
        where: { role: 'MEMBER' },
        include: {
          creatorStake: true,
          riskFlags: {
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { postedJobs: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, users });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /admin/users/:id/suspend — Update user status (ACTIVE, SUSPENDED, BANNED)
  fastify.patch('/users/:id/suspend', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { status, reason } = SuspendUserSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          status,
          ...(reason ? { revokeReason: reason } : {}),
        },
      });

      // Audit Log
      await AuditService.log({
        adminId: (request.user as any).userId ?? (request.user as any).sub,
        userId: id,
        action: `USER_${status}`,
        target: id,
        before: { status: user.status },
        after: { status: updatedUser.status, reason },
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      // Revoke sessions if suspended or banned
      if (status !== 'ACTIVE') {
        const sessions = await prisma.session.findMany({ where: { userId: id } });
        for (const s of sessions) {
          await redis.del(`session:${s.id}`);
        }
        await prisma.session.deleteMany({ where: { userId: id } });
      }

      return reply.send({ success: true, user: updatedUser });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /admin/users/:id/flags — Update Creator / Seller role flags
  fastify.patch('/users/:id/flags', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const flags = UpdateUserFlagsSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: flags,
      });

      await AuditService.log({
        adminId: (request.user as any).userId ?? (request.user as any).sub,
        userId: id,
        action: 'UPDATE_USER_FLAGS',
        target: id,
        before: { isCreator: user.isCreator, isSeller: user.isSeller, sellerApproved: user.sellerApproved },
        after: flags,
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, user: updatedUser });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /admin/users/:id/scores — Update Trust / Risk scores
  fastify.patch('/users/:id/scores', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const scores = UpdateUserScoresSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: scores,
      });

      await AuditService.log({
        adminId: (request.user as any).userId ?? (request.user as any).sub,
        userId: id,
        action: 'UPDATE_USER_SCORES',
        target: id,
        before: { trustScore: user.trustScore, riskScore: user.riskScore },
        after: scores,
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, user: updatedUser });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /admin/users/:id/warn — Send formal warning to user
  fastify.post('/users/:id/warn', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { warning } = WarnUserSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      // Record a risk flag for the warning & increment risk score by 10
      const newRiskScore = Math.min(100, user.riskScore + 10);
      const [updatedUser] = await Promise.all([
        prisma.user.update({
          where: { id },
          data: { riskScore: newRiskScore },
        }),
        prisma.riskFlag.create({
          data: {
            userId: id,
            flag: `ADMIN WARNING: ${warning}`,
            severity: 'MEDIUM',
            metadata: { warning, issuedBy: (request.user as any).userId },
          },
        }),
        AuditService.log({
          adminId: (request.user as any).userId ?? (request.user as any).sub,
          userId: id,
          action: 'WARN_USER',
          target: id,
          after: { warning, newRiskScore },
          ipAddress: request.ip,
          device: request.headers['user-agent'] ?? undefined,
        }),
      ]);

      return reply.send({ success: true, user: updatedUser, message: 'Warning issued successfully.' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/content/queue - Review queue for content
  fastify.get('/content/queue', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const content = await prisma.content.findMany({
        where: { status: 'PENDING' },
        include: { creator: { select: { id: true, displayName: true, username: true } } },
        orderBy: { createdAt: 'asc' },
      });
      return reply.send({ success: true, queue: content });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /admin/content/:id/approve - Approve content and publish to ledger
  fastify.patch('/content/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { status, adminNote } = ContentApproveSchema.parse(request.body);

      const content = await prisma.content.findUnique({ where: { id } });
      if (!content) {
        return reply.status(404).send({ error: 'Not Found', message: 'Content not found' });
      }

      let contractId = content.delistReason; // reuse fields or keep as mock
      let cantonResult;

      if (status === 'LIVE') {
        // Deploy ReadStake contract template on Canton (Logged transaction)
        cantonResult = await CantonService.executeReadStake(content.creatorId, id, 5.0);
        contractId = cantonResult.contractId;
      }

      const updatedContent = await prisma.content.update({
        where: { id },
        data: {
          status,
          adminNote,
          publishedAt: status === 'LIVE' ? new Date() : null,
          delistReason: status === 'LIVE' ? null : (status === 'DELISTED' ? 'Admin delisted' : null),
        },
      });

      // Audit Log
      await AuditService.log({
        adminId: (request.user as any).userId ?? (request.user as any).sub,
        action: `CONTENT_${status}`,
        target: id,
        before: { status: content.status },
        after: { status: updatedContent.status },
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({
        success: true,
        content: updatedContent,
        cantonTxId: cantonResult?.txId,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/disputes - View all disputes
  fastify.get('/disputes', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const disputes = await prisma.dispute.findMany({
        include: {
          job: {
            include: {
              client: { select: { id: true, displayName: true, walletAddress: true } },
              freelancer: { select: { id: true, displayName: true, walletAddress: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, disputes });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /admin/disputes/:id/resolve - Resolve dispute and split CC on-chain
  fastify.patch('/disputes/:id/resolve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { clientPct, freelancerPct, resolution } = ResolveDisputeSchema.parse(request.body);

      if (Math.abs(clientPct + freelancerPct - 1.0) > 0.001) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Split percentages must sum to 100% (1.0).' });
      }

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { job: { include: { client: true, freelancer: true } } },
      });

      if (!dispute || dispute.status === 'RESOLVED') {
        return reply.status(400).send({ error: 'Bad Request', message: 'Dispute is not active or already resolved.' });
      }

      const job = dispute.job;
      if (!job.freelancer || !job.freelancer.walletAddress || !job.client.walletAddress) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Client or Freelancer wallet addresses not found.' });
      }

      // Execute on-chain split split resolution (3 transactions generated)
      const cantonResult = await CantonService.executeDisputeResolution(
        job.id,
        job.freelancer.walletAddress,
        job.client.walletAddress,
        job.amountCC,
        freelancerPct,
        clientPct
      );

      // Update dispute record
      const updatedDispute = await prisma.dispute.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          clientPct,
          freelancerPct,
          resolution,
          resolvedAt: new Date(),
        },
      });

      // Update Job status to CANCELLED/COMPLETED depending on split
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'CANCELLED' }, // Standard resolution state
      });

      // Recalculate risk scores for dispute resolution: add severity if participant was mostly at fault
      if (freelancerPct < 0.3) {
        // Freelancer at fault -> increase risk score
        await RiskService.addRiskSignal(job.freelancerId!, 'Dispute resolution client-favored', 15, { disputeId: id });
      }
      if (clientPct < 0.3) {
        // Client at fault
        await RiskService.addRiskSignal(job.clientId, 'Dispute resolution freelancer-favored', 15, { disputeId: id });
      }

      // Audit Log
      await AuditService.log({
        adminId: (request.user as any).userId ?? (request.user as any).sub,
        action: 'RESOLVE_DISPUTE',
        target: id,
        before: { status: dispute.status },
        after: { status: updatedDispute.status, clientPct, freelancerPct },
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({
        success: true,
        dispute: updatedDispute,
        cantonTxId: cantonResult.txId,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/treasury - Get treasury status
  fastify.get('/treasury', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Calculate current reserve from mock balances in system.
      // Let's store treasury in redis under `treasury_balance`
      let treasuryBalanceStr = await redis.get('treasury_balance');
      if (!treasuryBalanceStr) {
        await redis.set('treasury_balance', '15000.0'); // Seed dev treasury with 15k CC
        treasuryBalanceStr = '15000.0';
      }

      const balanceCC = parseFloat(treasuryBalanceStr);
      const isUnderReserve = balanceCC < 10000.0; // Minimum reserve of 10,000 CC

      return reply.send({
        success: true,
        treasuryBalanceCC: balanceCC,
        minReserveRequirementCC: 10000.0,
        reserveStatus: isUnderReserve ? 'WARNING_UNDER_RESERVE' : 'HEALTHY',
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /admin/treasury/withdraw - Propose/approve treasury withdrawal (Multi-sig: 2 admin sign-offs)
  fastify.post('/treasury/withdraw', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { amountCC, destinationWallet } = WithdrawalRequestSchema.parse(request.body);
      const adminId = request.user.userId;

      // Enforce: Minimum reserve of 10,000 CC must remain in treasury
      let treasuryBalanceStr = await redis.get('treasury_balance') || '15000.0';
      const currentBalance = parseFloat(treasuryBalanceStr);

      if (currentBalance - amountCC < 10000.0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: `Withdrawal rejected. Enforced policy: treasury must maintain a minimum reserve of 10,000 CC. Maximum currently withdrawable: ${Math.max(0, currentBalance - 10000)} CC.`,
        });
      }

      // Check for active pending withdrawal in Redis to execute multi-sig sign-offs
      const activeWithdrawalKey = `pending_withdrawal:${destinationWallet}:${amountCC}`;
      const signersStr = await redis.get(activeWithdrawalKey);

      if (!signersStr) {
        // Initiator signature (Signature 1)
        await redis.set(activeWithdrawalKey, JSON.stringify([adminId]), { EX: 3600 }); // Expiry 1 hour
        return reply.send({
          success: true,
          status: 'PENDING_SECOND_SIGNATURE',
          message: 'Withdrawal request registered. Requires one more admin signature to execute.',
          currentApprovals: [adminId],
        });
      } else {
        const signers: string[] = JSON.parse(signersStr);

        if (signers.includes(adminId)) {
          return reply.status(400).send({ error: 'Bad Request', message: 'You have already approved this withdrawal request.' });
        }

        // Signature 2 matches -> Execute withdrawal!
        signers.push(adminId);

        // Deduct from treasury balance in Redis
        const finalBalance = currentBalance - amountCC;
        await redis.set('treasury_balance', finalBalance.toString());

        // Clear active withdrawal
        await redis.del(activeWithdrawalKey);

        // Log in AuditLog
        await AuditService.log({
          adminId,
          action: 'TREASURY_WITHDRAWAL',
          target: destinationWallet,
          before: { balance: currentBalance },
          after: { balance: finalBalance, withdrawnAmount: amountCC, signers },
          ipAddress: request.ip,
          device: request.headers['user-agent'] ?? undefined,
        });

        return reply.send({
          success: true,
          status: 'EXECUTED',
          message: `Withdrawal of ${amountCC} CC completed successfully. Released to wallet ${destinationWallet}.`,
          signers,
          remainingTreasuryBalanceCC: finalBalance,
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/config — Full config for SUPER_ADMIN (includes economics + control fields)
  // Redis-first with self-healing Postgres fallback
  fastify.get('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = await getFullPlatformConfig();
      return reply.send({ success: true, config });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /admin/config — Update platform config (ADMIN + SUPER_ADMIN)
  // Atomically increments version, overwrites Redis cache, broadcasts Socket.IO, writes AuditLog
  fastify.patch('/config', { preHandler: [roleGuard(['ADMIN', 'SUPER_ADMIN'])] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const configData = UpdateConfigSchema.parse(request.body);
      const adminId = (request.user as any).userId;

      // Convert nullable datetime strings to Date objects for Prisma
      const prepared: Record<string, any> = { ...configData };
      if ('bannerStart' in prepared) {
        prepared.bannerStart = prepared.bannerStart ? new Date(prepared.bannerStart) : null;
      }
      if ('bannerEnd' in prepared) {
        prepared.bannerEnd = prepared.bannerEnd ? new Date(prepared.bannerEnd) : null;
      }

      const updated = await updatePlatformConfig(prepared, adminId, request.ip);
      return reply.send({ success: true, config: updated });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GET /admin/team — List active admins + pending invites (SUPER_ADMIN + ADMIN)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.get('/team', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [activeAdmins, pendingInvites] = await Promise.all([
        prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'] } },
          select: {
            id: true,
            displayName: true,
            username: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.adminInvite.findMany({
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return reply.send({ success: true, activeAdmins, pendingInvites });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /admin/invites — Create invite (SUPER_ADMIN only)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/invites', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const callerRole = (request.user as any).role;
      if (callerRole !== 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only SUPER_ADMIN can invite admins.' });
      }

      const callerId = (request.user as any).userId ?? (request.user as any).sub;
      const { email, role } = InviteCreateSchema.parse(request.body);

      // Check that the email is not already taken by an active user
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(409).send({ error: 'Conflict', message: 'A user with this email already exists.' });
      }

      // Check that there is no active pending invite for this email
      const existingInvite = await prisma.adminInvite.findUnique({ where: { email } });
      if (existingInvite) {
        return reply.status(409).send({ error: 'Conflict', message: 'A pending invite already exists for this email.' });
      }

      const token = HashService.generateToken();
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      const invite = await prisma.adminInvite.create({
        data: { email, role, token, invitedBy: callerId, expiresAt },
      });

      const inviteLink = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/admin?inviteToken=${token}`;

      await AuditService.log({
        adminId: callerId,
        action: 'ADMIN_INVITE_CREATED',
        target: email,
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.status(201).send({
        success: true,
        message: 'Invite created successfully.',
        invite: { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt },
        inviteLink,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // DELETE /admin/invites/:id — Revoke pending invite (SUPER_ADMIN only)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.delete('/invites/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const callerRole = (request.user as any).role;
      if (callerRole !== 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only SUPER_ADMIN can revoke invites.' });
      }

      const { id } = request.params as { id: string };
      const invite = await prisma.adminInvite.findUnique({ where: { id } });
      if (!invite) {
        return reply.status(404).send({ error: 'Not Found', message: 'Invite not found.' });
      }

      await prisma.adminInvite.delete({ where: { id } });

      return reply.send({ success: true, message: 'Invite revoked.' });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // DELETE /admin/users/:id — Revoke admin account (SUPER_ADMIN only)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.delete('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const callerRole = (request.user as any).role;
      const callerId  = (request.user as any).userId ?? (request.user as any).sub;

      if (callerRole !== 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only SUPER_ADMIN can revoke admin accounts.' });
      }

      const { id } = request.params as { id: string };

      if (id === callerId) {
        return reply.status(400).send({ error: 'Bad Request', message: 'You cannot revoke your own account.' });
      }

      const { reason } = RevokeAdminSchema.parse(request.body);

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target || target.role === 'MEMBER') {
        return reply.status(404).send({ error: 'Not Found', message: 'Admin user not found.' });
      }

      // Soft-revoke: update status and save revocation log details
      await prisma.user.update({
        where: { id },
        data: {
          status: 'REVOKED',
          revokedBy: callerId,
          revokedAt: new Date(),
          revokeReason: reason,
        },
      });

      // Flush all active sessions for this user
      const sessions = await prisma.session.findMany({ where: { userId: id } });
      for (const s of sessions) {
        await redis.del(`session:${s.id}`);
      }
      await prisma.session.deleteMany({ where: { userId: id } });

      await AuditService.log({
        adminId: callerId,
        userId: id,
        action: 'ADMIN_REVOKED',
        target: id,
        after: { reason },
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'Admin access has been revoked successfully.' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /admin/users/:id/reactivate — Reactivate admin account (SUPER_ADMIN only)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/users/:id/reactivate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const callerRole = (request.user as any).role;
      const callerId  = (request.user as any).userId ?? (request.user as any).sub;

      if (callerRole !== 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only SUPER_ADMIN can reactivate admin accounts.' });
      }

      const { id } = request.params as { id: string };

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target || target.role === 'MEMBER') {
        return reply.status(404).send({ error: 'Not Found', message: 'Admin user not found.' });
      }

      if (target.status !== 'REVOKED') {
        return reply.status(400).send({ error: 'Bad Request', message: 'User account is not revoked.' });
      }

      // Restore status to ACTIVE and reset metadata
      await prisma.user.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          revokedBy: null,
          revokedAt: null,
          revokeReason: null,
        },
      });

      await AuditService.log({
        adminId: callerId,
        userId: id,
        action: 'ADMIN_REACTIVATED',
        target: id,
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'Admin account has been reactivated successfully.' });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // PATCH /admin/users/:id/role — Change admin role (SUPER_ADMIN only)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.patch('/users/:id/role', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const callerRole = (request.user as any).role;
      const callerId  = (request.user as any).userId ?? (request.user as any).sub;

      if (callerRole !== 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only SUPER_ADMIN can change admin roles.' });
      }

      const { id } = request.params as { id: string };

      if (id === callerId) {
        return reply.status(400).send({ error: 'Bad Request', message: 'You cannot change your own role.' });
      }

      const { role: newRole } = RoleUpdateSchema.parse(request.body);

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target || target.role === 'MEMBER') {
        return reply.status(404).send({ error: 'Not Found', message: 'Admin user not found.' });
      }

      await prisma.user.update({ where: { id }, data: { role: newRole } });

      // Flush sessions so the new role takes effect on next login
      const sessions = await prisma.session.findMany({ where: { userId: id } });
      for (const s of sessions) {
        await redis.del(`session:${s.id}`);
      }
      await prisma.session.deleteMany({ where: { userId: id } });

      await AuditService.log({
        userId: callerId,
        action: 'ADMIN_ROLE_CHANGED',
        target: id,
        before: { role: target.role },
        after:  { role: newRole },
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: `Role updated to ${newRole}.` });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // ─── CONTENT REVIEW QUEUE ENDPOINTS ───────────────────────────────────────

  // GET /admin/content-submissions — List all content submissions with creator data
  fastify.get('/content-submissions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const submissions = await prisma.content.findMany({
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              trustScore: true,
              riskScore: true,
              content: {
                select: {
                  id: true,
                  status: true,
                  avgRating: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ success: true, submissions });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /admin/content-submissions/:id/approve — Approve pending content
  fastify.post('/content-submissions/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { note } = (request.body || {}) as { note?: string };

      const content = await prisma.content.findUnique({ where: { id } });
      if (!content) {
        return reply.status(404).send({ error: 'Not Found', message: 'Content submission not found.' });
      }

      const updated = await prisma.content.update({
        where: { id },
        data: {
          status: 'LIVE',
          publishedAt: new Date(),
          adminNote: note || 'Approved by admin',
        },
      });

      await AuditService.log({
        userId: (request.user as any).userId,
        action: 'CONTENT_APPROVED',
        target: id,
        after: { title: content.title, creatorId: content.creatorId },
      });

      return reply.send({
        success: true,
        message: `Content "${content.title}" has been APPROVED and is now LIVE.`,
        content: updated,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /admin/content-submissions/:id/reject — Reject content submission
  fastify.post('/content-submissions/:id/reject', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { reason } = (request.body || {}) as { reason?: string };

      const content = await prisma.content.findUnique({ where: { id } });
      if (!content) {
        return reply.status(404).send({ error: 'Not Found', message: 'Content submission not found.' });
      }

      const updated = await prisma.content.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNote: reason || 'Rejected during admin review',
        },
      });

      await AuditService.log({
        userId: (request.user as any).userId,
        action: 'CONTENT_REJECTED',
        target: id,
        after: { title: content.title, creatorId: content.creatorId, reason },
      });

      return reply.send({
        success: true,
        message: `Content "${content.title}" has been REJECTED.`,
        content: updated,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Public invite-acceptance routes (no auth guard)
// ────────────────────────────────────────────────────────────────────────────

export async function publicInviteRoutes(fastify: FastifyInstance) {

  // GET /auth/admin/invites/:token — Validate invite token
  fastify.get('/admin/invites/:token', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = request.params as { token: string };
      const invite = await prisma.adminInvite.findUnique({ where: { token } });

      if (!invite) {
        return reply.status(404).send({ error: 'Not Found', message: 'Invite not found or already used.' });
      }
      if (invite.expiresAt < new Date()) {
        return reply.status(410).send({ error: 'Gone', message: 'This invite link has expired.' });
      }

      return reply.send({
        success: true,
        invite: { email: invite.email, role: invite.role, expiresAt: invite.expiresAt },
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /auth/admin/invites/:token/accept — Create admin account via invite
  fastify.post('/admin/invites/:token/accept', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = request.params as { token: string };
      const { fullName, username, password } = AcceptInviteSchema.parse(request.body);

      const invite = await prisma.adminInvite.findUnique({ where: { token } });
      if (!invite) {
        return reply.status(404).send({ error: 'Not Found', message: 'Invite not found or already used.' });
      }
      if (invite.expiresAt < new Date()) {
        return reply.status(410).send({ error: 'Gone', message: 'This invite link has expired.' });
      }

      // Check username isn't taken
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        return reply.status(409).send({ error: 'Conflict', message: 'Username is already taken.' });
      }

      const passwordHash = await HashService.hashPassword(password);

      await prisma.user.create({
        data: {
          displayName: fullName,
          username,
          email: invite.email,
          passwordHash,
          emailVerified: true,
          role: invite.role,
          status: 'ACTIVE',
          trustScore: 100,
        },
      });

      // Consume the invite
      await prisma.adminInvite.delete({ where: { token } });

      return reply.status(201).send({
        success: true,
        message: 'Account created. You can now sign in and complete your MFA setup.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}


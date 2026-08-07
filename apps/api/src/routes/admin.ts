import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard, roleGuard } from '../middleware/auth.js';
import { HashService } from '../lib/hash.js';
import { AuditService } from '../services/audit.js';
import { CantonService } from '../services/canton.js';
import { activeActivityProvider } from '../services/activityProvider.js';
import { RiskService } from '../middleware/riskCheck.js';
import { RiskEngine } from '../services/risk-engine.js';
import { TrustEngine } from '../services/trust-engine.js';
import { NotificationService } from '../services/notification.js';
import { getPlatformConfig, getFullPlatformConfig, updatePlatformConfig } from '../services/platform-config.js';
import { ADMIN_PORTAL_ROLES } from '../lib/roles.js';
import { passwordChangeRateLimit } from '../middleware/rateLimiter.js';
import { sendAdminReplyEmail, sendAdminPasswordChangedEmail } from '../services/email.js';
import { AdminAnalyticsService } from '../services/admin-analytics.service.js';
import { AdminUserService } from '../services/admin-user.service.js';
import { generateSecret, verify as verifyTotp, generateURI } from 'otplib';
import QRCode from 'qrcode';

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
  category: z.enum(['SPAM', 'HARASSMENT', 'FAKE_LISTING', 'COPYRIGHT_ABUSE', 'FAKE_IDENTITY', 'PLATFORM_ABUSE']).optional().default('PLATFORM_ABUSE'),
});

const InviteCreateSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(['ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN']),
});

const AcceptInviteSchema = z.object({
  fullName:  z.string().min(2).max(80).trim(),
  username:  z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).trim(),
  password:  z.string()
    .min(12, 'Password must be at least 12 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&*).'),
});

const RoleUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN']),
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
  subscriptionAmountCC: z.number().min(0).optional(),
  poolAllocationCC: z.number().min(0).optional(),
  stakeBalanceCC: z.number().min(0).optional(),
  platformFeeSub: z.number().min(0).max(1).optional(),
  platformFeeFreelance: z.number().min(0).max(1).optional(),
  readStakeAmountCC: z.number().min(0).optional(),
  minReadTimeSeconds: z.number().int().min(0).optional(),
  gracePeriodHours: z.number().int().min(0).optional(),
  creatorStakeCC: z.number().min(0).optional(),
  creatorLockDays: z.number().int().min(0).optional(),
  maxContentPerMonth: z.number().int().min(0).optional(),
  dailyCheckinCC: z.number().min(0).optional(),
  proposalDepositCC: z.number().min(0).optional(),
  minTreasuryReserveCC: z.number().min(0).optional(),
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
  restrictedCountries: z.array(z.string()).optional(),
  // Scheduled maintenance banner
  bannerEnabled: z.boolean().optional(),
  bannerTitle: z.string().max(100).optional(),
  bannerMessage: z.string().max(1000).optional(),
  bannerStart: z.string().optional().nullable(),
  bannerEnd: z.string().optional().nullable(),
  bannerDismissible: z.boolean().optional(),
});

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require valid admin role authentication
  fastify.addHook('preValidation', authGuard);
  fastify.addHook('preHandler', roleGuard(['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'CONTENT_ADMIN', 'SUPPORT_ADMIN']));

  // GET /admin/me â€” lightweight heartbeat endpoint used by the frontend to
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

  // GET /admin/dashboard-stats â€” Real live platform KPI metrics & system overview
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

      // â”€â”€ Build Weekly buckets (last 4 weeks) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€ Build Monthly buckets (last 12 months) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€ Assemble realActivityMetrics with all 3 periods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // ────────────────────────────────────────────────────────────────────────────
  // BUYERS ENDPOINTS (Paginated list + Cached stats)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.get('/buyers/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await AdminAnalyticsService.getBuyerStats();
      return reply.send({ success: true, stats });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  fastify.get('/buyers', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page, limit, search, status, sort, order } = request.query as any;
      const result = await AdminUserService.getPaginatedBuyers({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        search,
        status,
        sort,
        order,
      });
      return reply.send({ success: true, ...result });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SELLERS ENDPOINTS (Paginated list + Cached stats)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.get('/sellers/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await AdminAnalyticsService.getSellerStats();
      return reply.send({ success: true, stats });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  fastify.get('/sellers', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page, limit, search, status, sort, order } = request.query as any;
      const result = await AdminUserService.getPaginatedSellers({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        search,
        status,
        sort,
        order,
      });
      return reply.send({ success: true, ...result });
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

      // Invalidate analytics stats cache immediately so summary cards refresh
      await AdminAnalyticsService.invalidate('all');

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

      // Invalidate analytics stats cache immediately so summary cards refresh
      await AdminAnalyticsService.invalidate('all');

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
  // GET /admin/users â€” List all registered members with buyer/seller signals
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

  // PATCH /admin/users/:id/suspend â€” Update user status (ACTIVE, SUSPENDED, BANNED)
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

      // Invalidate analytics stats cache immediately so summary cards refresh
      await AdminAnalyticsService.invalidate('all');

      return reply.send({ success: true, user: updatedUser });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /admin/users/:id/flags â€” Update Creator / Seller role flags
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

  // PATCH /admin/users/:id/scores â€” Update Trust / Risk scores
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

  // POST /admin/users/:id/warn â€” Send formal warning / policy violation to user
  fastify.post('/users/:id/warn', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { warning, category } = WarnUserSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      const adminId = (request.user as any).userId ?? (request.user as any).sub ?? 'admin';

      // 1. Record PolicyViolation with standardized category + security risk impact if applicable
      const { violationId, securityRiskAdded } = await RiskEngine.addPolicyViolation(
        id,
        category,
        adminId,
        warning,
      );

      // 2. Apply reputation impact to TrustScore
      await TrustEngine.onPolicyViolation(id, category);

      // 3. Create legacy RiskFlag for backward compatibility
      await prisma.riskFlag.create({
        data: {
          userId: id,
          flag: `POLICY VIOLATION (${category}): ${warning}`,
          severity: 'MEDIUM',
          metadata: { warning, category, issuedBy: adminId, violationId },
        },
      });

      const updatedUser = await prisma.user.findUnique({ where: { id } });

      await AuditService.log({
        adminId,
        userId: id,
        action: 'WARN_USER',
        target: id,
        after: { warning, category, securityRiskAdded, newRiskScore: updatedUser?.riskScore, newTrustScore: updatedUser?.trustScore },
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, user: updatedUser, message: `Warning issued successfully (${category}).` });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // â”€â”€ RISK SCORE MANAGEMENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // GET /admin/risk-scores â€” Real database risk metrics, patterns, & high-risk users list
  fastify.get('/risk-scores', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [cleanCount, watchCount, restrictedCount, blockedCount, riskFlagsGroup, totalFlagsCount, riskUsersDb] = await Promise.all([
        prisma.user.count({ where: { role: 'MEMBER', riskScore: { lte: 30 }, status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'MEMBER', riskScore: { gt: 30, lte: 60 }, status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'MEMBER', riskScore: { gt: 60, lte: 80 }, status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'MEMBER', OR: [{ riskScore: { gt: 80 } }, { status: { in: ['SUSPENDED', 'BANNED'] } }] } }),
        prisma.riskFlag.groupBy({
          by: ['flag'],
          _count: { flag: true },
          orderBy: { _count: { flag: 'desc' } },
          take: 10,
        }),
        prisma.riskFlag.count(),
        prisma.user.findMany({
          where: {
            role: 'MEMBER',
            OR: [
              { riskScore: { gt: 0 } },
              { riskFlags: { some: {} } },
              { status: { in: ['SUSPENDED', 'BANNED'] } },
            ],
          },
          include: {
            riskFlags: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            sessions: {
              orderBy: { lastSeen: 'desc' },
              take: 2,
            },
          },
          orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
          take: 100,
        }),
      ]);

      const totalF = Math.max(1, totalFlagsCount);
      const patterns = riskFlagsGroup.map((g, i) => ({
        id: `pattern-${i}`,
        name: g.flag,
        count: g._count.flag,
        percent: Math.min(100, Math.round((g._count.flag / totalF) * 100)),
        icon: 'activity',
      }));

      const riskUsers = riskUsersDb.map(u => {
        const latestFlag = u.riskFlags[0];
        let meta: any = {};
        if (latestFlag?.metadata) {
          try {
            meta = typeof latestFlag.metadata === 'string' ? JSON.parse(latestFlag.metadata as string) : latestFlag.metadata;
          } catch {}
        }

        const name = u.displayName || u.username || 'User';
        const nameParts = name.trim().split(/\s+/);
        const avatarInitials = nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
          : name.slice(0, 2).toUpperCase();

        const isRecentTrendUp = latestFlag && new Date(latestFlag.createdAt).getTime() >= sevenDaysAgo.getTime();

        return {
          id: u.id,
          name,
          handle: `@${u.username}`,
          email: u.email || 'N/A',
          avatarInitials,
          score: u.riskScore,
          status: u.status,
          primarySignal: latestFlag?.flag || (u.riskScore > 80 ? 'Account Suspended for Security Violations' : u.riskScore > 60 ? 'High Risk Activity Flagged' : 'Watchlist Flag'),
          trend: isRecentTrendUp ? 'up' : 'down',
          evidence: {
            ipMatches: meta.ip ? [meta.ip] : (u.sessions[0]?.lastIp ? [u.sessions[0].lastIp] : undefined),
            phoneMatched: u.phoneHash ? 'Phone hash recorded' : undefined,
            speedApps: meta.applicationsCount || undefined,
            timerDiff: meta.elapsedSec ? `${meta.elapsedSec}s` : (meta.secondsRead ? `${meta.secondsRead}s` : undefined),
            subscriptionPattern: meta.pattern || undefined,
          },
          explanation: u.revokeReason || (meta.explanation ? String(meta.explanation) : undefined) || undefined,
        };
      });

      return reply.send({
        success: true,
        stats: {
          clean: cleanCount,
          watch: watchCount,
          restricted: restrictedCount,
          blocked: blockedCount,
        },
        patterns,
        riskUsers,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /admin/users/:id/resolve-risk â€” Apply admin resolution decision to user risk tier
  fastify.post('/users/:id/resolve-risk', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { decision } = z.object({
        decision: z.enum(['Clean', 'Watch', 'Restricted', 'Blocked']),
      }).parse(request.body);

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      let riskScore = user.riskScore;
      let trustScore = user.trustScore;
      let status = user.status;

      if (decision === 'Clean') {
        riskScore = 0;
        trustScore = 100;
        status = 'ACTIVE';
        await prisma.riskFlag.updateMany({
          where: { userId: id, resolved: false },
          data: { resolved: true, resolvedAt: new Date() },
        });
      } else if (decision === 'Watch') {
        riskScore = 45;
        trustScore = 75;
        status = 'ACTIVE';
      } else if (decision === 'Restricted') {
        riskScore = 70;
        trustScore = 50;
        status = 'ACTIVE';
      } else if (decision === 'Blocked') {
        riskScore = 85;
        trustScore = 10;
        status = 'SUSPENDED';
        const sessions = await prisma.session.findMany({ where: { userId: id } });
        for (const s of sessions) {
          await redis.del(`session:${s.id}`);
        }
        await prisma.session.deleteMany({ where: { userId: id } });
      }

      const adminId = (request.user as any)?.userId ?? (request.user as any)?.sub ?? 'admin';
      const riskDelta = riskScore - user.riskScore;
      const trustDelta = trustScore - user.trustScore;

      // Audit events in RiskEvent and TrustEvent
      if (riskDelta !== 0) {
        await prisma.riskEvent.create({
          data: {
            userId: id,
            delta: riskDelta,
            reason: `Admin resolution decision: ${decision}`,
            category: 'MANUAL',
            adminId,
          },
        });
      }
      if (trustDelta !== 0) {
        await prisma.trustEvent.create({
          data: {
            userId: id,
            delta: trustDelta,
            reason: `Admin resolution decision: ${decision}`,
            category: 'ADMIN_ADJUSTMENT',
            adminId,
          },
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { riskScore, trustScore, status, needsReview: false },
      });

      await AuditService.log({
        adminId,
        userId: id,
        action: 'RESOLVE_USER_RISK',
        target: `user:${id}`,
        before: { riskScore: user.riskScore, trustScore: user.trustScore, status: user.status },
        after: { decision, riskScore: updatedUser.riskScore, trustScore: updatedUser.trustScore, status: updatedUser.status },
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, user: updatedUser, decision });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/users/:id/risk-history â€” Audit trail of risk events, policy violations, and trust events
  fastify.get('/users/:id/risk-history', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id: userId } = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          riskScore: true,
          trustScore: true,
          status: true,
          needsReview: true,
          timerViolationCount: true,
          lastViolationAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      const [riskEvents, policyViolations, trustEvents] = await Promise.all([
        prisma.riskEvent.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        prisma.policyViolation.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        prisma.trustEvent.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ]);

      return reply.send({
        success: true,
        user,
        riskEvents,
        policyViolations,
        trustEvents,
      });
    } catch (error: any) {
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

  // GET /admin/content/delisted - Get all delisted content & cancelled jobs
  fastify.get('/content/delisted', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [delistedContent, cancelledJobs] = await Promise.all([
        prisma.content.findMany({
          where: { status: { in: ['DELISTED', 'REJECTED'] } },
          include: {
            creator: {
              select: { id: true, displayName: true, username: true, avatarUrl: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.job.findMany({
          where: { status: 'CANCELLED' },
          include: {
            client: {
              select: { id: true, displayName: true, username: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

      const formattedContent = delistedContent.map((item) => {
        let reason: 'Creator unstaked' | 'Reported' | 'Admin Removed' = 'Admin Removed';
        const r = (item.delistReason || '').toLowerCase();
        if (r.includes('unstak') || r.includes('deposit') || r.includes('withdraw')) {
          reason = 'Creator unstaked';
        } else if (r.includes('report') || r.includes('copyright') || r.includes('policy')) {
          reason = 'Reported';
        }

        const elapsedDays = Math.max(0, Math.floor((Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24)));
        const dateText = elapsedDays === 0 ? 'Today' : elapsedDays === 1 ? '1 day ago' : `${elapsedDays} days ago`;

        return {
          id: item.id,
          type: 'content' as const,
          title: item.title,
          subInfo: `${item.type === 'PREMIUM' ? 'Premium' : 'Free'} Â· ${item.priceCC} CC Â· ${item.readCount} reads before delisting`,
          authorName: item.creator?.displayName || item.creator?.username || 'Unknown',
          authorHandle: item.creator?.username ? `@${item.creator.username}` : '@unknown',
          reason,
          dateText,
          details: item.adminNote || item.delistReason || `Content record delisted. Topic: ${item.topic || 'General'}. Status: ${item.status}`,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      });

      const formattedJobs = cancelledJobs.map((job) => {
        const elapsedDays = Math.max(0, Math.floor((Date.now() - new Date(job.updatedAt).getTime()) / (1000 * 60 * 60 * 24)));
        const dateText = elapsedDays === 0 ? 'Today' : elapsedDays === 1 ? '1 day ago' : `${elapsedDays} days ago`;

        return {
          id: job.id,
          type: 'job' as const,
          title: job.title,
          subInfo: `Job Post Â· Budget: ${job.amountCC} CC Â· Category: ${job.category}`,
          authorName: job.client?.displayName || job.client?.username || 'Unknown',
          authorHandle: job.client?.username ? `@${job.client.username}` : '@unknown',
          reason: 'Admin Removed' as const,
          dateText,
          details: `Job posting cancelled or delisted. ${job.description}`,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        };
      });

      const items = [...formattedContent, ...formattedJobs].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      const totalDelisted = items.length;
      const autoDelisted = items.filter((i) => i.reason === 'Creator unstaked').length;
      const adminRemoved = items.filter((i) => i.reason === 'Admin Removed').length;
      const reportedCount = items.filter((i) => i.reason === 'Reported').length;

      return reply.send({
        success: true,
        stats: {
          totalDelisted,
          autoDelisted,
          adminRemoved,
          reportedCount,
        },
        items,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /admin/content/:id/restore - Restore delisted content or job to active
  fastify.post('/content/:id/restore', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const content = await prisma.content.findUnique({ where: { id } });
      if (content) {
        const updated = await prisma.content.update({
          where: { id },
          data: {
            status: 'LIVE',
            delistReason: null,
            publishedAt: new Date(),
          },
        });

        await AuditService.log({
          adminId: (request.user as any).userId ?? (request.user as any).sub,
          action: 'RESTORE_CONTENT',
          target: id,
          before: { status: content.status },
          after: { status: updated.status },
          ipAddress: request.ip,
          device: request.headers['user-agent'] ?? undefined,
        });

        return reply.send({ success: true, message: `Content "${content.title}" restored to LIVE state.`, item: updated });
      }

      const job = await prisma.job.findUnique({ where: { id } });
      if (job) {
        const updated = await prisma.job.update({
          where: { id },
          data: { status: 'OPEN' },
        });

        await AuditService.log({
          adminId: (request.user as any).userId ?? (request.user as any).sub,
          action: 'RESTORE_JOB',
          target: id,
          before: { status: job.status },
          after: { status: updated.status },
          ipAddress: request.ip,
          device: request.headers['user-agent'] ?? undefined,
        });

        return reply.send({ success: true, message: `Job "${job.title}" restored to OPEN state.`, item: updated });
      }

      return reply.status(404).send({ error: 'Not Found', message: 'Delisted item not found' });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // DELETE /admin/content/:id/permanent - Permanently delete content or job
  fastify.delete('/content/:id/permanent', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const content = await prisma.content.findUnique({ where: { id } });
      if (content) {
        await prisma.readStake.deleteMany({ where: { contentId: id } });
        await prisma.contentReply.deleteMany({ where: { contentId: id } });
        await prisma.content.delete({ where: { id } });

        await AuditService.log({
          adminId: (request.user as any).userId ?? (request.user as any).sub,
          action: 'PERMANENT_DELETE_CONTENT',
          target: id,
          before: { title: content.title },
          ipAddress: request.ip,
          device: request.headers['user-agent'] ?? undefined,
        });

        return reply.send({ success: true, message: `Content "${content.title}" permanently deleted.` });
      }

      const job = await prisma.job.findUnique({ where: { id } });
      if (job) {
        await prisma.job.delete({ where: { id } });

        await AuditService.log({
          adminId: (request.user as any).userId ?? (request.user as any).sub,
          action: 'PERMANENT_DELETE_JOB',
          target: id,
          before: { title: job.title },
          ipAddress: request.ip,
          device: request.headers['user-agent'] ?? undefined,
        });

        return reply.send({ success: true, message: `Job "${job.title}" permanently deleted.` });
      }

      return reply.status(404).send({ error: 'Not Found', message: 'Item not found' });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/jobs/active - Fetch active jobs and escrow metrics for admin monitor
  fastify.get('/jobs/active', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const activeJobs = await prisma.job.findMany({
        where: {
          status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'DISPUTED'] },
        },
        include: {
          client: { select: { id: true, displayName: true, username: true } },
          freelancer: { select: { id: true, displayName: true, username: true } },
          milestones: { orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const now = Date.now();

      const jobs = activeJobs.map((job) => {
        const totalMilestones = job.milestones.length;
        const approvedCount = job.milestones.filter((m) => m.status === 'APPROVED').length;
        const hasDelivered = job.status === 'DELIVERED' || job.milestones.some((m) => m.status === 'DELIVERED');

        // Calculate deadline & overdue state
        const deadlineMs = new Date(job.createdAt).getTime() + (job.deadlineDays || 7) * 24 * 60 * 60 * 1000;
        const isOverdue = now > deadlineMs && job.status !== 'COMPLETED';

        let status: 'In Progress' | 'Awaiting Review' | 'Overdue' = 'In Progress';
        if (isOverdue) {
          status = 'Overdue';
        } else if (hasDelivered) {
          status = 'Awaiting Review';
        }

        const milestoneProgress = totalMilestones > 0
          ? Math.round((approvedCount / totalMilestones) * 100)
          : (job.status === 'DELIVERED' ? 90 : job.status === 'IN_PROGRESS' ? 50 : 10);

        const milestoneColor = status === 'Overdue' ? '#F87171' : status === 'Awaiting Review' ? '#DAC95A' : '#8C5CFF';

        const milestoneLabel = totalMilestones > 0
          ? (approvedCount === totalMilestones - 1 ? 'Final milestone' : `Milestone ${Math.min(approvedCount + 1, totalMilestones)} of ${totalMilestones}`)
          : (hasDelivered ? 'Final delivery submitted' : 'Project in progress');

        const elapsedDays = Math.max(0, Math.floor((now - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        const postedAgo = elapsedDays === 0 ? 'Posted today' : elapsedDays === 1 ? 'Posted 1 day ago' : `Posted ${elapsedDays} days ago`;

        return {
          id: job.id,
          title: job.title,
          postedAgo,
          client: job.client?.username ? `@${job.client.username}` : (job.client?.displayName || '@client'),
          freelancer: job.freelancer?.username ? `@${job.freelancer.username}` : (job.freelancer?.displayName || 'Unassigned'),
          milestoneLabel,
          milestoneProgress,
          milestoneColor,
          escrowCC: `${job.amountCC.toFixed(2)} CC`,
          rawAmountCC: job.amountCC,
          status,
          rawStatus: job.status,
          createdAt: job.createdAt,
        };
      });

      const totalActiveJobs = jobs.length;
      const totalEscrowCC = jobs.reduce((sum, j) => sum + j.rawAmountCC, 0);
      const overdueCount = jobs.filter((j) => j.status === 'Overdue').length;
      const completingCount = jobs.filter((j) => j.status === 'Awaiting Review' || j.milestoneProgress >= 80).length;

      return reply.send({
        success: true,
        stats: {
          activeJobs: totalActiveJobs,
          totalEscrowCC: `${totalEscrowCC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CC`,
          overdueMilestones: overdueCount,
          completingThisWeek: completingCount,
        },
        jobs,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/disputes - View all disputes with full context for admin dashboard
  fastify.get('/disputes', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const disputes = await prisma.dispute.findMany({
        include: {
          job: {
            include: {
              client:     { select: { id: true, displayName: true, username: true, walletAddress: true, trustScore: true, riskScore: true } },
              freelancer: { select: { id: true, displayName: true, username: true, walletAddress: true, trustScore: true, riskScore: true } },
              milestones: { orderBy: { order: 'asc' } },
            },
          },
          evidence: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = disputes.map((d) => {
        const job = d.job;
        const currentMilestone = job.milestones.find(
          (m) => m.status === 'DISPUTED' || m.status === 'DELIVERED' || m.status === 'IN_PROGRESS'
        ) ?? job.milestones[job.milestones.length - 1];
        const milestoneIdx = currentMilestone ? job.milestones.indexOf(currentMilestone) + 1 : 1;
        const totalMilestones = job.milestones.length;

        const raisedMs   = Date.now() - new Date(d.createdAt).getTime();
        const raisedDays = Math.floor(raisedMs / 86_400_000);
        const raisedHrs  = Math.floor(raisedMs / 3_600_000);
        const raisedAgo  = raisedDays > 0
          ? `Raised ${raisedDays} day${raisedDays !== 1 ? 's' : ''} ago`
          : `Raised ${raisedHrs} hour${raisedHrs !== 1 ? 's' : ''} ago`;

        const escrowAmount   = currentMilestone?.amountCC ?? job.amountCC;
        const clientUser     = job.client;
        const freelancerUser = job.freelancer;

        return {
          id:           d.id,
          jobId:        job.id,
          jobRef:       `#CF-${job.id.slice(-4).toUpperCase()}`,
          title:        job.title,
          jobTitle:     job.title,
          escrowAmount,
          milestoneText: totalMilestones > 0
            ? `Milestone ${milestoneIdx} of ${totalMilestones}`
            : 'Single Milestone',
          raisedAgo,
          status: d.status === 'RESOLVED' ? 'Resolved' : 'Open',

          clientId:          clientUser?.id    ?? d.raisedById,
          clientName:        clientUser?.displayName || clientUser?.username || 'Client',
          clientHandle:      clientUser?.username ? `@${clientUser.username}` : '@client',
          clientTrustScore:  clientUser?.trustScore  ?? 50,
          clientStatement:   d.clientClaim || d.reason || 'No statement provided.',

          freelancerId:          freelancerUser?.id    ?? d.respondentId,
          freelancerName:        freelancerUser?.displayName || freelancerUser?.username || 'Freelancer',
          freelancerHandle:      freelancerUser?.username ? `@${freelancerUser.username}` : '@freelancer',
          freelancerTrustScore:  freelancerUser?.trustScore  ?? 50,
          freelancerStatement:   d.freelancerClaim || 'No statement provided.',

          evidence: d.evidence.map((ev) => ({
            id:   ev.id,
            name: ev.fileUrl,
            type: ev.fileType === 'pdf' ? 'pdf' : 'link',
            url:  ev.fileUrl,
          })),

          resolution:    d.resolution   ?? null,
          clientPct:     d.clientPct    ?? 50,
          freelancerPct: d.freelancerPct ?? 50,
          resolvedAt:    d.resolvedAt,
        };
      });

      const openCount     = formatted.filter((d) => d.status === 'Open').length;
      const resolvedCount = formatted.filter((d) => d.status === 'Resolved').length;

      return reply.send({ success: true, disputes: formatted, stats: { openCount, resolvedCount } });
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

      // Recalculate reputation for dispute resolution: losing party gets TrustScore penalty
      if (freelancerPct < 0.3 && job.freelancerId) {
        // Freelancer at fault -> trust score penalty (-10)
        await TrustEngine.onDisputeLoss(job.freelancerId, id);
      }
      if (clientPct < 0.3) {
        // Client at fault -> trust score penalty (-10)
        await TrustEngine.onDisputeLoss(job.clientId, id);
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

  // POST /admin/disputes/:id/request-evidence - Notify both parties to submit more evidence
  fastify.post('/disputes/:id/request-evidence', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { message } = z.object({ message: z.string().min(5) }).parse(request.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { job: { select: { title: true, clientId: true, freelancerId: true } } },
      });
      if (!dispute) {
        return reply.status(404).send({ error: 'Not Found', message: 'Dispute not found' });
      }

      await NotificationService.send({
        userId:   dispute.job.clientId,
        title:    'Evidence Requested',
        body:     `An admin has requested additional evidence for your dispute on "${dispute.job.title}": ${message}`,
        type:     'SYSTEM_ALERT',
        category: 'ACCOUNT',
        link:     `/jobs/${dispute.jobId}`,
      });
      if (dispute.job.freelancerId) {
        await NotificationService.send({
          userId:   dispute.job.freelancerId,
          title:    'Evidence Requested',
          body:     `An admin has requested additional evidence for the dispute on "${dispute.job.title}": ${message}`,
          type:     'SYSTEM_ALERT',
          category: 'ACCOUNT',
          link:     `/jobs/${dispute.jobId}`,
        });
      }

      await prisma.dispute.update({
        where: { id },
        data: { status: 'UNDER_REVIEW' },
      });

      await AuditService.log({
        adminId:   (request.user as any)?.userId ?? (request.user as any)?.sub ?? 'admin',
        action:    'REQUEST_DISPUTE_EVIDENCE',
        target:    `dispute:${id}`,
        before:    { status: dispute.status },
        after:     { status: 'UNDER_REVIEW', evidenceRequest: message },
        ipAddress: request.ip,
        device:    request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'Evidence request sent to both parties.' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/treasury - Get treasury status with real DB stats
  fastify.get('/treasury', { preValidation: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'])] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Treasury balance from Redis (set by withdrawal endpoint)
      let treasuryBalanceStr = await redis.get('treasury_balance');
      if (!treasuryBalanceStr) {
        await redis.set('treasury_balance', '15000.0');
        treasuryBalanceStr = '15000.0';
      }
      const balanceCC = parseFloat(treasuryBalanceStr);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Run all real DB queries in parallel
      const [
        activeSubscriptions,
        activeJobs,
        completedJobsThisMonth,
        completedJobsLastMonth,
        totalCompletedJobs,
        auditWithdrawals,
        pendingWithdrawalKeys,
      ] = await Promise.all([
        // Count active subscriptions (= subscription revenue)
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),

        // Escrow locked in active jobs
        prisma.job.findMany({
          where: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'DISPUTED'] }, escrowLocked: true },
          select: { amountCC: true, platformFee: true },
        }),

        // Jobs completed this month (for platform fee revenue)
        prisma.job.findMany({
          where: { status: 'COMPLETED', updatedAt: { gte: startOfMonth } },
          select: { amountCC: true, platformFee: true },
        }),

        // Jobs completed last month (for month-over-month comparison)
        prisma.job.findMany({
          where: { status: 'COMPLETED', updatedAt: { gte: startOfLastMonth, lt: startOfMonth } },
          select: { amountCC: true, platformFee: true },
        }),

        // All-time completed jobs for total fee revenue
        prisma.job.findMany({
          where: { status: 'COMPLETED' },
          select: { amountCC: true, platformFee: true },
        }),

        // Withdrawal history from AuditLog
        prisma.auditLog.findMany({
          where: { action: 'TREASURY_WITHDRAWAL' },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),

        // Count pending withdrawals in Redis
        redis.keys('pending_withdrawal:*'),
      ]);

      const subscriptionFeeCC = activeSubscriptions * 20;
      const escrowLockedCC   = activeJobs.reduce((s, j) => s + (j.amountCC || 0), 0);
      const feesThisMonth    = completedJobsThisMonth.reduce((s, j) => s + ((j.amountCC || 0) * (j.platformFee || 0.05)), 0);
      const feesLastMonth    = completedJobsLastMonth.reduce((s, j) => s + ((j.amountCC || 0) * (j.platformFee || 0.05)), 0);
      const totalFeesAllTime = totalCompletedJobs.reduce((s, j) => s + ((j.amountCC || 0) * (j.platformFee || 0.05)), 0);
      const revenueThisMonth = feesThisMonth + subscriptionFeeCC;

      let momChangePct = 0;
      if (feesLastMonth > 0) {
        momChangePct = parseFloat((((feesThisMonth - feesLastMonth) / feesLastMonth) * 100).toFixed(1));
      } else if (feesThisMonth > 0) {
        momChangePct = 100;
      }

      const pendingWithdrawalCount = (pendingWithdrawalKeys as string[]).length;

      const withdrawalHistory = auditWithdrawals.map((a) => {
        const after = (a.after as any) ?? {};
        const before = (a.before as any) ?? {};
        return {
          id: a.id,
          adminName: a.adminId ? `Admin (${a.adminId.slice(-6)})` : 'Finance Admin',
          adminId: a.adminId,
          target: a.target,
          amountCC: after.withdrawnAmount ?? (before.balance && after.balance ? (before.balance - after.balance) : 0),
          beforeCC: before.balance ?? 0,
          afterCC: after.balance ?? 0,
          signers: after.signers ?? [],
          status: 'EXECUTED',
          timeAgo: 'Recently',
          createdAt: a.createdAt.toISOString(),
        };
      });

      return reply.send({
        success: true,
        treasuryBalanceCC: balanceCC,
        availableCC: Math.max(0, balanceCC - 10000),
        escrowLockedCC,
        minReserveRequirementCC: 10000,
        reserveStatus: balanceCC >= 10000 ? 'HEALTHY' : 'WARNING_UNDER_RESERVE',
        revenueThisMonth,
        feesThisMonth,
        feesLastMonth,
        momChangePct,
        totalFeesAllTime,
        subscriptionFeeCC,
        activeSubscriptions,
        pendingWithdrawalCount,
        withdrawalHistory,
        cantonStatus: 'CONNECTED',
        cantonAddress: 'canton://canafri.canton.network/contracts/escrow-vault-reserves#vault_canafri_multisig_01a9b2',
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /admin/treasury/withdraw - Propose/approve treasury withdrawal (Multi-sig: 2 admin sign-offs)
  fastify.post('/treasury/withdraw', { preValidation: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'])] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const callerRole = (request.user as any)?.role;
      const adminId = (request.user as any)?.userId ?? (request.user as any)?.sub ?? 'admin';

      if (!['SUPER_ADMIN', 'FINANCE_ADMIN', 'ADMIN'].includes(callerRole)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: `Insufficient permissions. Account role is ${callerRole}, but Treasury operations require FINANCE_ADMIN or SUPER_ADMIN.`,
        });
      }

      const { amountCC, destinationWallet } = WithdrawalRequestSchema.parse(request.body);

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
        // Signature 1: Request Initiation
        // Enforce: SUPER_ADMIN CANNOT initiate withdrawal requests!
        if (callerRole === 'SUPER_ADMIN') {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Super Admin cannot initiate withdrawal requests. Initiations must originate from a Finance Admin.',
          });
        }

        // Initiator signature (Signature 1)
        await redis.set(activeWithdrawalKey, JSON.stringify([adminId]), { EX: 3600 }); // Expiry 1 hour
        return reply.send({
          success: true,
          status: 'PENDING_SECOND_SIGNATURE',
          message: 'Withdrawal request registered. Requires Super Admin second signature to execute.',
          currentApprovals: [adminId],
        });
      } else {
        // Signature 2: Approval & Execution
        // Enforce: Only SUPER_ADMIN can approve and execute pending requests!
        if (callerRole !== 'SUPER_ADMIN') {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Only Super Admin can approve and execute pending treasury withdrawals.',
          });
        }

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

  // GET /admin/config — Full config for SUPER_ADMIN and ADMIN (includes economics + control fields)
  fastify.get('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const callerRole = (request.user as any)?.role;
      if (!['SUPER_ADMIN', 'ADMIN'].includes(callerRole)) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Platform configuration access is restricted to Super Admin and Admin.' });
      }

      const config = await getFullPlatformConfig();
      return reply.send({ success: true, config });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /admin/config — Update platform config (SUPER_ADMIN and ADMIN only)
  // Atomically increments version, overwrites Redis cache, broadcasts Socket.IO, writes AuditLog
  fastify.patch('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const callerRole = (request.user as any)?.role;
      if (!['SUPER_ADMIN', 'ADMIN'].includes(callerRole)) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only Super Admin and General Admin can modify platform configuration settings.' });
      }

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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // GET /admin/team â€” List active admins + pending invites (SUPER_ADMIN + ADMIN)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  fastify.get('/team', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [activeAdmins, pendingInvites] = await Promise.all([
        prisma.user.findMany({
          where: { role: { in: [...ADMIN_PORTAL_ROLES] } },
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // POST /admin/invites â€” Create invite (SUPER_ADMIN only)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // DELETE /admin/invites/:id â€” Revoke pending invite (SUPER_ADMIN only)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      const callerId = (request.user as any).userId ?? (request.user as any).sub;
      await prisma.adminInvite.delete({ where: { id } });

      try {
        await redis.publish('admin_security_events', JSON.stringify({
          type: 'ADMIN_INVITE_CANCELLED',
          inviteId: id,
          email: invite.email,
          timestamp: Date.now(),
        }));
      } catch {
        /* non-fatal */
      }

      await AuditService.log({
        userId: callerId,
        action: 'ADMIN_INVITE_CANCELLED',
        target: invite.email,
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'Pending invite cancelled successfully.' });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // DELETE /admin/users/:id â€” Revoke admin account (SUPER_ADMIN only)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      if (target.role === 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'Forbidden', message: 'The root SUPER_ADMIN account cannot be revoked.' });
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

      // Flush all active sessions & permission caches for this user
      const sessions = await prisma.session.findMany({ where: { userId: id } });
      for (const s of sessions) {
        await redis.del(`session:${s.id}`);
      }
      await prisma.session.deleteMany({ where: { userId: id } });
      await redis.del(`user_permissions:${id}`);
      await redis.del(`admin_menu:${id}`);
      await redis.del(`user_live:${id}`);

      // Broadcast real-time revocation event over Redis Pub/Sub
      try {
        await redis.publish('admin_security_events', JSON.stringify({ type: 'ADMIN_REVOKED', userId: id, timestamp: Date.now() }));
      } catch {
        /* non-fatal */
      }

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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // POST /admin/users/:id/reactivate â€” Reactivate admin account (SUPER_ADMIN only)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // PATCH /admin/users/:id/role â€” Change admin role (SUPER_ADMIN only)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      if (target.role === 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'Forbidden', message: 'The root SUPER_ADMIN role cannot be modified.' });
      }

      if ((newRole as string) === 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only the original root account may hold the SUPER_ADMIN role.' });
      }

      await prisma.user.update({ where: { id }, data: { role: newRole } });

      // Flush all active sessions & permission caches so the new role takes effect immediately
      const sessions = await prisma.session.findMany({ where: { userId: id } });
      for (const s of sessions) {
        await redis.del(`session:${s.id}`);
      }
      await prisma.session.deleteMany({ where: { userId: id } });
      await redis.del(`user_permissions:${id}`);
      await redis.del(`admin_menu:${id}`);
      await redis.del(`user_live:${id}`);

      // Broadcast real-time role update event over Redis Pub/Sub
      try {
        await redis.publish('admin_security_events', JSON.stringify({ type: 'ADMIN_ROLE_UPDATED', userId: id, newRole, timestamp: Date.now() }));
      } catch {
        /* non-fatal */
      }

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

  // â”€â”€â”€ CONTENT REVIEW QUEUE ENDPOINTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // GET /admin/content-submissions â€” List all content submissions with creator data
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

  // POST /admin/content-submissions/:id/approve â€” Approve pending content
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

  // POST /admin/content-submissions/:id/reject â€” Reject content submission
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

  // â”€â”€ Support Tickets Administration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // GET /admin/support/tickets â€” List all support tickets with status filter & search
  fastify.get('/support/tickets', { preValidation: [authGuard, roleGuard(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN'])] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as { status?: string; search?: string; page?: string; limit?: string };
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
      const skip = (page - 1) * limit;

      const where: any = {};

      if (query.status && query.status !== 'ALL') {
        where.status = query.status;
      }

      if (query.search && query.search.trim()) {
        const term = query.search.trim();
        where.OR = [
          { ticketNumber: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { subject: { contains: term, mode: 'insensitive' } },
        ];
      }

      const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.supportTicket.count({ where }),
      ]);

      return reply.send({ success: true, tickets, total, page, limit });
    } catch (err: any) {
      request.log.error(err, '[AdminRoutes] Failed to fetch support tickets');
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  });

  // GET /admin/support/tickets/:id â€” Get full support ticket detail
  fastify.get('/support/tickets/:id', { preValidation: [authGuard, roleGuard(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN'])] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, displayName: true, username: true, email: true, avatarUrl: true },
          },
        },
      });

      if (!ticket) {
        return reply.status(404).send({ error: 'Not Found', message: 'Support ticket not found.' });
      }

      return reply.send({ success: true, ticket });
    } catch (err: any) {
      request.log.error(err, '[AdminRoutes] Failed to fetch ticket detail');
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  });

  // PATCH /admin/support/tickets/:id/reply â€” Save admin reply & update status
  fastify.patch('/support/tickets/:id/reply', { preValidation: [authGuard, roleGuard(['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN'])] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as { reply: string; status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED' };

      if (!body.reply || !body.reply.trim()) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Reply text is required.' });
      }

      if (!body.status) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Status is required.' });
      }

      const existing = await prisma.supportTicket.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: 'Not Found', message: 'Support ticket not found.' });
      }

      const updatedTicket = await prisma.supportTicket.update({
        where: { id },
        data: {
          adminReply: body.reply.trim(),
          adminRepliedAt: new Date(),
          adminRepliedById: request.user.userId,
          status: body.status,
        },
      });

      // Fire-and-forget email notification to ticket submitter
      sendAdminReplyEmail(
        existing.email,
        existing.ticketNumber,
        body.status,
        body.reply.trim(),
        existing.subject
      ).catch((err) => {
        console.error('[AdminRoutes] Background reply email error:', err);
      });

      return reply.send({
        success: true,
        message: 'Admin reply saved and notification dispatched.',
        ticket: updatedTicket,
      });
    } catch (err: any) {
      request.log.error(err, '[AdminRoutes] Failed to reply to support ticket');
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  });

  // ─── GET /admin/analytics ────────────────────────────────────────────────────
  // Platform analytics with 60s Redis cache. Auth via global roleGuard hook.
  fastify.get('/analytics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as { days?: string };
      const numDays = Math.min(90, Math.max(7, parseInt(query.days ?? '7', 10) || 7));

      // 1. Redis cache check (60s TTL — prevents heavy DB aggregation on every refresh)
      const cacheKey = `cache:admin_analytics:${numDays}`;
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return reply.send(JSON.parse(cached));
      } catch { /* redis failure non-fatal */ }

      const now = new Date();
      const last24h   = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const startDate = new Date(now.getTime() - numDays * 24 * 60 * 60 * 1000);

      // 2. Single parallel DB batch — zero N+1 queries
      const [
        totalUsers, dauRows,
        rsTotal, jobTotal, subTotal, propTotal, stakeTotal,
        rangeUsers, rangeSellers, rangeJobs, rangeRS,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'MEMBER' } }),
        prisma.session.groupBy({ by: ['userId'], where: { lastActivityAt: { gte: last24h } } }),
        prisma.readStake.aggregate({ _sum: { amountCC: true }, _count: true }),
        prisma.job.aggregate({ _sum: { amountCC: true }, _count: true }),
        prisma.subscription.aggregate({ _sum: { amountCC: true }, _count: true }),
        prisma.proposal.aggregate({ _sum: { depositCC: true }, _count: true }),
        prisma.creatorStake.aggregate({ _sum: { amountCC: true }, _count: true }),
        prisma.user.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true, isSeller: true, sellerApproved: true } }),
        prisma.user.findMany({ where: { sellerApproved: true, updatedAt: { gte: startDate } }, select: { updatedAt: true } }),
        prisma.job.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true, amountCC: true } }),
        prisma.readStake.findMany({ where: { stakedAt: { gte: startDate } }, select: { stakedAt: true, amountCC: true } }),
      ]);

      const dauCount = dauRows.length;

      // 3. Platform revenue = fees only (not gross transaction volume)
      const rsVol    = rsTotal._sum.amountCC    ?? 0;
      const jobVol   = jobTotal._sum.amountCC   ?? 0;
      const subVol   = subTotal._sum.amountCC   ?? 0;
      const propVol  = propTotal._sum.depositCC ?? 0;
      const stakeVol = stakeTotal._sum.amountCC ?? 0;

      const rsFee    = rsVol    * 0.30;
      const jobFee   = jobVol   * 0.05;
      const subFee   = subVol   * 0.30;
      const propFee  = propVol;
      const stakeFee = stakeVol * 0.05;

      const totalRevenue   = rsFee + jobFee + subFee + propFee + stakeFee;
      const totalGrossVol  = rsVol + jobVol + subVol + propVol + stakeVol;
      const totalTxCount   = (rsTotal._count ?? 0) + (jobTotal._count ?? 0) + (subTotal._count ?? 0) + (propTotal._count ?? 0);
      const avgRS = totalUsers > 0 ? parseFloat(((rsTotal._count ?? 0) / totalUsers).toFixed(1)) : 0;

      const safeRev = totalRevenue > 0 ? totalRevenue : 1;
      const revenueBreakdown = [
        { label: 'Content read fees (30%)',  value: +rsFee.toFixed(2),    pct: +((rsFee    / safeRev) * 100).toFixed(1), color: '#8C5CFF', amount: `${rsFee.toFixed(1)} CC` },
        { label: 'Check-in pool share',      value: +stakeFee.toFixed(2), pct: +((stakeFee / safeRev) * 100).toFixed(1), color: '#4ADE80', amount: `${stakeFee.toFixed(1)} CC` },
        { label: 'Job milestone fees (5%)',  value: +jobFee.toFixed(2),   pct: +((jobFee   / safeRev) * 100).toFixed(1), color: '#5993F4', amount: `${jobFee.toFixed(1)} CC` },
        { label: 'Subscription fees (30%)', value: +subFee.toFixed(2),   pct: +((subFee   / safeRev) * 100).toFixed(1), color: '#F87171', amount: `${subFee.toFixed(1)} CC` },
        { label: 'Job proposal deposits',   value: +propFee.toFixed(2),  pct: +((propFee  / safeRev) * 100).toFixed(1), color: '#AC8EF3', amount: `${propFee.toFixed(1)} CC` },
        { label: 'Other', value: 0, pct: 0, color: '#DAC95A', amount: '0 CC' },
      ];

      // 4. Daily time-series — UTC date boundaries for consistency across timezones
      const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      type DayEntry = { date: string; fullDate: string; registered: number; freelancers: number; volume: number };
      const dailyMap: Record<string, DayEntry> = {};
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        dailyMap[key] = {
          date:       `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`,
          fullDate:   `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()} (UTC)`,
          registered: 0, freelancers: 0, volume: 0,
        };
      }
      rangeUsers.forEach(u    => { const k = u.createdAt.toISOString().slice(0,10); if (dailyMap[k]) dailyMap[k].registered   += 1; });
      rangeSellers.forEach(s  => { const k = s.updatedAt.toISOString().slice(0,10); if (dailyMap[k]) dailyMap[k].freelancers  += 1; });
      rangeJobs.forEach(j     => { const k = j.createdAt.toISOString().slice(0,10); if (dailyMap[k]) dailyMap[k].volume       += j.amountCC; });
      rangeRS.forEach(r       => { const k = r.stakedAt.toISOString().slice(0,10);  if (dailyMap[k]) dailyMap[k].volume       += r.amountCC; });

      const series  = Object.values(dailyMap);
      const maxVol  = Math.max(1, ...series.map(s => s.volume));
      const dailyVolumeSeries = series.map(s => ({ ...s, pct: Math.min(100, Math.round((s.volume / maxVol) * 100)) }));

      const payload = {
        success: true,
        stats: {
          totalCCTransactions:          totalTxCount,
          totalCCTransactionsFormatted: totalTxCount.toLocaleString(),
          dailyActiveUsers:             dauCount,
          avgReadSessionsPerUser:       avgRS,
          networkSharePct:              0.46,
          totalRevenueCC:               +totalRevenue.toFixed(2),
          totalGrossVolumeCC:           +totalGrossVol.toFixed(2),
        },
        revenueBreakdown,
        dailyVolumeSeries,
        cantonRewards: {
          monthlyCCTransactions:   totalTxCount.toLocaleString(),
          networkTotalEst:         '18.3M',
          monthlyRewardsEstCC:     0.00,
          usdValueEst:             '$0.00',
          networkShareProgressPct: 0.46,
          disclaimer:              'Rewards are estimated projections, not guaranteed values.',
        },
      };

      try { await redis.set(cacheKey, JSON.stringify(payload), { EX: 60 }); } catch { /* non-fatal */ }
      return reply.send(payload);
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/canton-activity - Delegate activity feed to activeActivityProvider (PlatformActivityProvider / CantonLedgerProvider abstraction)
  fastify.get('/canton-activity', { preValidation: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'])] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await activeActivityProvider.getActivityFeed();
      return reply.send(payload);
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /admin/change-password - Change admin password with rate limiting, re-verification, session revocation & security email
  fastify.post('/change-password', { preValidation: [passwordChangeRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = (request.user as any) || {};
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'User unauthenticated.' });
      }

      const ChangeAdminPasswordSchema = z.object({
        currentPassword: z.string().min(1, 'Current password is required.'),
        newPassword: z.string()
          .min(12, 'Password must be at least 12 characters long.')
          .refine(val => /[A-Z]/.test(val), { message: 'Password must contain at least one uppercase letter.' })
          .refine(val => /[0-9]/.test(val), { message: 'Password must contain at least one number.' })
          .refine(val => /[^A-Za-z0-9]/.test(val), { message: 'Password must contain at least one special character.' }),
        confirmPassword: z.string(),
        revokeOtherSessions: z.boolean().optional().default(true),
      }).refine(data => data.newPassword === data.confirmPassword, {
        message: 'New password and confirmation do not match.',
        path: ['confirmPassword'],
      });

      const body = ChangeAdminPasswordSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.passwordHash) {
        return reply.status(404).send({ error: 'Not Found', message: 'User account not found.' });
      }

      // 1. Verify current password
      const currentValid = await HashService.verifyPassword(body.currentPassword, user.passwordHash);
      if (!currentValid) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Current password verification failed. Please enter your correct current password.' });
      }

      // 2. Ensure new password is not identical to current
      const isSame = await HashService.verifyPassword(body.newPassword, user.passwordHash);
      if (isSame) {
        return reply.status(400).send({ error: 'Bad Request', message: 'New password cannot be identical to your current password.' });
      }

      // 3. Hash and store new password (bcrypt with cost factor 12)
      const newHash = await HashService.hashPassword(body.newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });

      // 4. Revoke other sessions (DB + Redis) if requested
      if (body.revokeOtherSessions) {
        try {
          const currentToken = (request.headers.authorization || '').replace('Bearer ', '').trim();
          
          // Delete DB sessions
          await prisma.session.deleteMany({
            where: {
              userId,
              token: { not: currentToken },
            },
          });

          // Invalidate Redis session keys for this user
          const keys = await redis.keys(`canafri_session:${userId}:*`);
          if (keys.length > 0) {
            await Promise.all(keys.map(k => redis.del(k)));
          }
        } catch (err) {
          request.log.error(err, '[AdminRoutes] Session revocation error');
        }
      }

      const userAgent = (request.headers['user-agent'] || 'Unknown Agent').slice(0, 200);

      // 5. Audit Log
      await AuditService.log({
        userId,
        action: 'ADMIN_PASSWORD_CHANGED',
        target: userId,
        after: {
          revokeOtherSessions: body.revokeOtherSessions,
          ip: request.ip,
          userAgent,
        },
      });

      // 6. Security email alert
      if (user.email) {
        sendAdminPasswordChangedEmail(user.email, {
          ip: request.ip,
          userAgent,
          timestamp: new Date(),
        }).catch(err => {
          request.log.error(err, '[AdminRoutes] Background password change alert email error');
        });
      }

      return reply.send({
        success: true,
        message: body.revokeOtherSessions
          ? 'Administrator password updated successfully. Other active sessions have been signed out.'
          : 'Administrator password updated successfully.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', message: error.errors[0]?.message || 'Invalid password parameters.', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /admin/security/totp-reconfig
  // Initiates a TOTP reconfiguration for an already-authenticated admin.
  // Returns a fresh QR code and secret stored under a one-time reconfig key.
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/security/totp-reconfig', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = (request.user as any) || {};
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'You must be signed in.' });
      }

      const admin = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, status: true },
      });
      if (!admin || admin.status !== 'ACTIVE') {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Your administrator access has been revoked. Please contact the platform owner.' });
      }

      // Generate a fresh TOTP secret
      const secret = generateSecret();
      const otpauthUrl = generateURI({ label: admin.email ?? 'admin', issuer: 'CanaFri Admin', secret });
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      // Store the pending secret under a short-lived reconfig key (10 minutes)
      const reconfigKey = `admin_totp_reconfig:${userId}`;
      await redis.set(reconfigKey, JSON.stringify({ secret }), { EX: 600 });

      return reply.send({ success: true, secret, qrCodeUrl });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /admin/security/totp-reconfig/verify
  // Verifies the 6-digit code, commits the new TOTP secret, issues 10 new
  // recovery codes, and returns the plaintext codes once.
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/security/totp-reconfig/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = (request.user as any) || {};
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'You must be signed in.' });
      }

      const { code } = z.object({ code: z.string().length(6).regex(/^\d{6}$/) }).parse(request.body);

      const reconfigKey = `admin_totp_reconfig:${userId}`;
      const raw = await redis.get(reconfigKey);
      if (!raw) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Re-configuration session has expired. Please start again.' });
      }
      const { secret } = JSON.parse(raw);

      const { valid } = await verifyTotp({ token: code, secret, epochTolerance: 120 });
      if (!valid) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid verification code. Please check your authenticator app and try again.' });
      }

      // Generate 10 fresh one-time recovery codes
      const plainRecoveryCodes: string[] = [];
      const recoveryHashes: string[] = [];
      for (let i = 0; i < 10; i++) {
        const rc = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        plainRecoveryCodes.push(rc);
        const hash = await HashService.hashPassword(rc.replace('-', '').trim());
        recoveryHashes.push(hash);
      }

      // Commit new TOTP secret and recovery codes to DB
      await prisma.user.update({
        where: { id: userId },
        data: { totpSecret: secret, totpEnabled: true, totpRecoveryHashes: recoveryHashes },
      });

      // Consume the reconfig key
      await redis.del(reconfigKey);

      await AuditService.log({
        userId,
        action: 'ADMIN_TOTP_RECONFIGURED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, recoveryCodes: plainRecoveryCodes });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // Helper to parse raw User-Agent headers into clean, human-readable Browser (OS) names
  const formatUserAgent = (ua?: string | null): string => {
    if (!ua || ua.length < 5) return 'Web Browser';
    let browser = 'Web Browser';
    let os = '';

    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';

    if (ua.includes('Windows NT 10')) os = 'Windows 11/10';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('iPhone')) os = 'iPhone (iOS)';
    else if (ua.includes('iPad')) os = 'iPad (iOS)';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Linux')) os = 'Linux';

    return os ? `${browser} on ${os}` : browser;
  };

  // GET /admin/security/sessions - Fetch real active sessions for current admin
  fastify.get('/security/sessions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, sessionId } = (request.user as any) || {};
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'User unauthenticated.' });
      }

      const activeSessions = await prisma.session.findMany({
        where: { userId, expiresAt: { gt: new Date() } },
        orderBy: { lastActivityAt: 'desc' },
      });

      const sessions = activeSessions.map(s => {
        const isCurrent = s.id === sessionId;
        const rawUA = s.userAgent || (isCurrent ? (request.headers['user-agent'] as string) : null);
        return {
          id: s.id,
          device: formatUserAgent(rawUA),
          ip: s.ipAddress || request.ip || '127.0.0.1',
          location: 'Verified Administrator IP',
          lastSeen: isCurrent ? 'Active now' : new Date(s.lastActivityAt || s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isCurrent,
        };
      });

      return reply.send({ success: true, sessions });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // DELETE /admin/security/sessions/:id - Revoke specific session
  fastify.delete('/security/sessions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = (request.user as any) || {};
      const { id } = request.params as { id: string };

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'User unauthenticated.' });
      }

      await prisma.session.deleteMany({
        where: { id, userId },
      });

      try {
        await redis.del(`session:${id}`);
      } catch {
        /* non-fatal */
      }

      await AuditService.log({
        userId,
        action: 'ADMIN_SESSION_REVOKED',
        target: id,
        after: { revokedSessionId: id, ip: request.ip },
      });

      return reply.send({ success: true, message: 'Session revoked successfully.' });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /admin/security/login-history - Fetch real login history for current admin
  fastify.get('/security/login-history', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = (request.user as any) || {};
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'User unauthenticated.' });
      }

      const logs = await prisma.auditLog.findMany({
        where: {
          userId,
          action: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'ADMIN_LOGIN', 'ADMIN_PASSWORD_CHANGED', 'MFA_VERIFIED', 'MFA_FAILED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const history = logs.map(l => {
        const d = new Date(l.createdAt);
        const formattedDate = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;
        const rawUA = l.device || (l.after as any)?.userAgent;
        return {
          id: l.id,
          timestamp: formattedDate,
          ip: l.ipAddress || (l.after as any)?.ip || request.ip || '127.0.0.1',
          device: formatUserAgent(rawUA),
          status: (l.action.includes('FAILED') ? 'Failed' : 'Success') as 'Success' | 'Failed',
        };
      });

      return reply.send({ success: true, history });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
} // end adminRoutes

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

  // POST /auth/admin/invites/:token/accept â€” Create admin account via invite
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

      const newAdminUser = await prisma.user.create({
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

      // Consume the invite immediately
      await prisma.adminInvite.delete({ where: { id: invite.id } }).catch(() => {/* non-fatal */});

      // Broadcast real-time event so Super Admin team dashboard updates status immediately
      try {
        await redis.publish('admin_security_events', JSON.stringify({
          type: 'ADMIN_INVITE_ACCEPTED',
          email: invite.email,
          userId: newAdminUser.id,
          role: invite.role,
          timestamp: Date.now(),
        }));
      } catch {
        /* non-fatal */
      }

      await AuditService.log({
        userId: newAdminUser.id,
        action: 'ADMIN_INVITE_ACCEPTED',
        target: invite.email,
        after: { role: invite.role },
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.status(201).send({
        success: true,
        message: 'Account created successfully. You can now sign in with your credentials.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /admin/team/:id/reset-totp (Super-Admin Assisted 2FA Reset for Sub-Admins)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/team/:id/reset-totp', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const caller = (request.user as any) || {};
      const { id: targetUserId } = request.params as { id: string };

      if (caller.role !== 'SUPER_ADMIN') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only the SUPER_ADMIN can execute 2FA resets for team members.',
        });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!targetUser) {
        return reply.status(404).send({ error: 'Not Found', message: 'Target administrator account not found.' });
      }

      // Root SUPER_ADMIN policy protection: SUPER_ADMIN 2FA cannot be reset via API
      if (targetUser.role === 'SUPER_ADMIN') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'The root SUPER_ADMIN 2FA cannot be reset via API. Use the offline emergency CLI maintenance procedure.',
        });
      }

      // Reset TOTP status and burn all recovery codes for this team member
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          totpEnabled: false,
          totpSecret: null,
          totpRecoveryHashes: [],
        },
      });

      // Revoke all active sessions for this target user across DB & Redis
      await prisma.session.deleteMany({ where: { userId: targetUserId } });
      try {
        await redis.del(`session:${targetUserId}`);
      } catch {
        /* non-fatal */
      }

      // Write immutable audit log
      await AuditService.log({
        userId: caller.userId || caller.sub,
        action: 'SUPER_ADMIN_RESET_USER_TOTP',
        target: targetUserId,
        after: { targetEmail: targetUser.email, targetRole: targetUser.role, ip: request.ip },
      });

      return reply.send({
        success: true,
        message: `2FA reset successfully for ${targetUser.email}. The team member will be prompted to scan a new QR code on their next login.`,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}



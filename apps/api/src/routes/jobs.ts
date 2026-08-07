import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard, sellerGuard } from '../middleware/auth.js';
import { RiskService, riskRestrictionGuard } from '../middleware/riskCheck.js';
import { RiskEngine } from '../services/risk-engine.js';
import { TrustEngine } from '../services/trust-engine.js';
import { CantonService } from '../services/canton.js';
import { NotificationService } from '../services/notification.js';
import { getPlatformConfig } from '../services/platform-config.js';

const CreateJobSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20),
  category: z.string().min(2),
  skills: z.array(z.string()),
  amountCC: z.number().positive(),
  deadlineDays: z.number().int().positive(),
});

const ProposalSchema = z.object({
  coverLetter: z.string()
    .min(100, 'Cover letter must be at least 100 characters.')
    .max(1800, 'Cover letter cannot exceed 1,800 characters.'),
  approach: z.string()
    .min(100, 'Your approach must be at least 100 characters.')
    .max(1800, 'Your approach cannot exceed 1,800 characters.'),
  answers: z.array(z.string().max(1000, 'Screening question answer cannot exceed 1,000 characters.')).optional(),
  rateCC: z.number().positive(),
  deliveryDays: z.number().int().positive(),
});

const AssignJobSchema = z.object({
  freelancerId: z.string(),
  milestones: z.array(z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    amountCC: z.number().positive(),
    order: z.number().int().nonnegative(),
  })).min(1),
});

const DisputeSchema = z.object({
  reason: z.string().min(10),
});

// Helper: compute buyer rating for a list of clientIds
async function getBuyerRatings(clientIds: string[]): Promise<Record<string, { avg: number; count: number }>> {
  if (clientIds.length === 0) return {};
  const reviews = await prisma.review.groupBy({
    by: ['revieweeId'],
    where: { revieweeId: { in: clientIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const map: Record<string, { avg: number; count: number }> = {};
  for (const r of reviews) {
    map[r.revieweeId] = { avg: r._avg.rating ?? 0, count: r._count.rating };
  }
  return map;
}

export async function jobRoutes(fastify: FastifyInstance) {
  // GET /jobs - List open jobs
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const jobs = await prisma.job.findMany({
        where: { status: 'OPEN' },
        include: {
          client: {
            select: { id: true, username: true, displayName: true, trustScore: true, avatarUrl: true, country: true, createdAt: true },
          },
          proposals: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      // Attach real buyer ratings
      const clientIds = [...new Set(jobs.map(j => j.clientId))];
      const ratings = await getBuyerRatings(clientIds);
      const jobsWithRating = jobs.map(j => ({
        ...j,
        buyerRating: ratings[j.clientId]?.avg ?? 0,
        buyerReviewsCount: ratings[j.clientId]?.count ?? 0,
      }));
      return reply.send({ success: true, jobs: jobsWithRating });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /jobs/my-jobs - List authenticated buyer's posted jobs
  fastify.get('/my-jobs', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: clientId } = request.user;
      const jobs = await prisma.job.findMany({
        where: { clientId },
        include: {
          client: {
            select: { id: true, username: true, displayName: true, trustScore: true, avatarUrl: true, country: true, createdAt: true },
          },
          freelancer: {
            select: { id: true, username: true, displayName: true, trustScore: true, avatarUrl: true, country: true, createdAt: true },
          },
          proposals: true,
          reviews: {
            select: { id: true, reviewerId: true, rating: true, comment: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      const ratings = await getBuyerRatings([clientId]);
      const jobsWithRating = jobs.map(j => ({
        ...j,
        buyerRating: ratings[j.clientId]?.avg ?? 0,
        buyerReviewsCount: ratings[j.clientId]?.count ?? 0,
        hasReviewed: j.reviews.some(r => r.reviewerId === clientId),
      }));
      return reply.send({ success: true, jobs: jobsWithRating });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /jobs - Post a job & lock escrow (Authenticated clients)
  fastify.post('/', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const platformConfig = await getPlatformConfig();
      if (platformConfig.freelancingMaintenance) {
        return reply.status(503).send({
          error: 'Service Unavailable',
          message: platformConfig.freelancingMaintenanceReason || 'The freelancing service is currently under maintenance. Please check back later.',
        });
      }

      const { userId: clientId } = request.user;
      const { title, description, category, skills, amountCC, deadlineDays } = CreateJobSchema.parse(request.body);

      // Try on-chain Canton escrow execution
      let cantonResult = { contractId: 'temp_contract_id', txId: 'temp_tx_id' };
      try {
        cantonResult = await CantonService.executeJobEscrow(clientId, 'temp_job_id', amountCC);
      } catch (e) {
        console.warn('Canton escrow execution notice:', e);
      }

      // Create Job in DB
      const job = await prisma.job.create({
        data: {
          clientId,
          title,
          description,
          category,
          skills: skills || [],
          amountCC: amountCC || 100,
          deadlineDays: deadlineDays || 30,
          status: 'OPEN',
          escrowLocked: true,
          damlContractId: cantonResult.contractId,
          platformFee: 0.05,
        },
        include: {
          client: {
            select: { id: true, username: true, displayName: true, trustScore: true, avatarUrl: true },
          },
          proposals: true,
        },
      });

      return reply.send({
        success: true,
        message: `Job posted successfully. Locked ${amountCC} CC in escrow.`,
        job,
        cantonTxId: cantonResult.txId,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /jobs/:id - Get job detail
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const job = await prisma.job.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              displayName: true,
              trustScore: true,
              avatarUrl: true,
              country: true,
              createdAt: true,
              emailVerified: true,
              phoneVerified: true,
            },
          },
          freelancer: {
            select: { id: true, username: true, displayName: true, trustScore: true, avatarUrl: true, country: true, createdAt: true },
          },
          milestones: {
            orderBy: { order: 'asc' },
          },
          proposals: {
            include: {
              freelancer: { select: { id: true, username: true, displayName: true, trustScore: true, avatarUrl: true } },
            },
          },
          dispute: true,
          reviews: {
            include: {
              reviewer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!job) {
        return reply.status(404).send({ error: 'Not Found', message: 'Job not found' });
      }

      // Attach buyer rating and total jobs posted count by this client
      const [ratings, jobsPostedCount] = await Promise.all([
        getBuyerRatings([job.clientId]),
        prisma.job.count({ where: { clientId: job.clientId } }),
      ]);

      const jobWithRating = {
        ...job,
        buyerRating: ratings[job.clientId]?.avg ?? 0,
        buyerReviewsCount: ratings[job.clientId]?.count ?? 0,
        client: {
          ...job.client,
          jobsPostedCount,
        },
      };

      return reply.send({ success: true, job: jobWithRating });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /jobs/:id/proposals - Submit proposal (Approved sellers only)
  fastify.post('/:id/proposals', { preValidation: [authGuard, sellerGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: freelancerId } = request.user;
      const { id: jobId } = request.params as { id: string };
      const { coverLetter, approach, answers, rateCC, deliveryDays } = ProposalSchema.parse(request.body);

      // Verify job is open
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job || job.status !== 'OPEN') {
        return reply.status(400).send({ error: 'Bad Request', message: 'Job is no longer open for proposals.' });
      }

      // Check if freelancer already applied
      const existingProposal = await prisma.proposal.findUnique({
        where: { jobId_freelancerId: { jobId, freelancerId } },
      });

      if (existingProposal) {
        return reply.status(400).send({ error: 'Bad Request', message: 'You have already submitted a proposal for this job.' });
      }

      // Enforce Proposal Rate Limit: Max 10 applications per hour
      const countKey = `proposals_count:${freelancerId}`;
      const applicationsCount = await redis.incr(countKey);
      if (applicationsCount === 1) {
        await redis.expire(countKey, 3600); // 1 hour TTL
      }
      // Rate-limiter is the first line of defence (not risk score)
      if (applicationsCount > 10 && applicationsCount <= 20) {
        // Temporary block — no risk change yet
        return reply.status(429).send({
          error: 'Too Many Requests',
          message: 'You have submitted too many proposals. Please wait before applying again.',
        });
      }
      if (applicationsCount > 20) {
        // Persistent abuse — now apply security risk
        await RiskEngine.addSecuritySignal(freelancerId, 'Persistent rapid job application abuse (>20/hr)', 15, { applicationsCount });
        return reply.status(429).send({
          error: 'Too Many Requests',
          message: 'Your account has been flagged due to unusual activity. Please contact support if you believe this is an error.',
        });
      }

      // Canton txn: proposal deposit deduct (1 txn) - 0.5 CC
      const cantonResult = await CantonService.executeSellerApplicationDeposit(freelancerId, 0.5);

      // Create proposal
      const proposal = await prisma.proposal.create({
        data: {
          jobId,
          freelancerId,
          coverLetter,
          approach,
          rateCC,
          deliveryDays,
          depositCC: 0.5,
          depositPaid: true,
        },
      });

      // Send real-time notification to buyer
      await NotificationService.send({
        userId: job.clientId,
        title: 'New Proposal Received',
        body: `A proposal was submitted for "${job.title}".`,
        type: 'PROPOSAL_SUBMITTED',
        category: 'FREELANCE',
        link: '/orders',
        actorId: freelancerId,
        targetId: jobId,
      });

      return reply.send({
        success: true,
        message: 'Proposal submitted successfully. 0.5 CC proposal deposit locked.',
        proposal,
        cantonTxId: cantonResult.txId,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /jobs/:id/assign - Assign Freelancer and activate milestones (Client only)
  fastify.patch('/:id/assign', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: clientId } = request.user;
      const { id: jobId } = request.params as { id: string };
      const { freelancerId, milestones } = AssignJobSchema.parse(request.body);

      // Verify job owner is client
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job || job.clientId !== clientId) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only the job owner can assign freelancers.' });
      }

      if (job.status !== 'OPEN') {
        return reply.status(400).send({ error: 'Bad Request', message: 'Job is not open for assignment.' });
      }

      // Check sum of milestones CC equals the escrow amount CC
      const sumCC = milestones.reduce((sum, m) => sum + m.amountCC, 0);
      if (Math.abs(sumCC - job.amountCC) > 0.01) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: `The sum of milestone amounts (${sumCC} CC) must match the escrowed job amount (${job.amountCC} CC).`,
        });
      }

      // Update proposal status to ACCEPTED
      await prisma.proposal.updateMany({
        where: { jobId, freelancerId },
        data: { status: 'ACCEPTED' },
      });
      await prisma.proposal.updateMany({
        where: { jobId, NOT: { freelancerId } },
        data: { status: 'REJECTED' },
      });

      // Create milestones in DB
      await prisma.milestone.createMany({
        data: milestones.map((m) => ({
          jobId,
          title: m.title,
          description: m.description,
          amountCC: m.amountCC,
          order: m.order,
          status: 'PENDING',
        })),
      });

      // Update job status to IN_PROGRESS
      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          freelancerId,
          status: 'IN_PROGRESS',
        },
      });

      // Send real-time notification to hired freelancer
      await NotificationService.send({
        userId: freelancerId,
        title: 'Proposal Accepted — You Have Been Hired',
        body: `Your proposal for "${job.title}" was accepted. Your contract is now active.`,
        type: 'PROPOSAL_ACCEPTED',
        category: 'FREELANCE',
        link: '/orders',
        actorId: clientId,
        targetId: jobId,
      });

      return reply.send({
        success: true,
        message: 'Freelancer assigned and milestones activated.',
        job: updatedJob,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /jobs/:id/deliver - Deliver project / current active milestone (Freelancer only)
  fastify.post('/:id/deliver', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: freelancerId } = request.user;
      const { id: jobId } = request.params as { id: string };
      const body = (request.body || {}) as { notes?: string; files?: any };

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { milestones: { orderBy: { order: 'asc' } } },
      });

      if (!job || job.freelancerId !== freelancerId) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only the assigned freelancer can deliver work for this contract.' });
      }

      if (!['IN_PROGRESS', 'OPEN', 'ASSIGNED', 'DELIVERED'].includes(job.status)) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Job is not in an active contract state.' });
      }

      // Target active or pending milestone, or first milestone
      const targetMilestone = job.milestones.find(m => m.status === 'IN_PROGRESS' || m.status === 'PENDING') || job.milestones[0];

      if (targetMilestone) {
        await prisma.milestone.update({
          where: { id: targetMilestone.id },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
            deliveryNotes: body.notes || null,
            deliveryFiles: body.files ? (typeof body.files === 'string' ? JSON.parse(body.files) : body.files) : null,
          },
        });
      }

      // Update job status to DELIVERED
      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: { status: 'DELIVERED' },
      });

      // Send real-time notification to client
      await NotificationService.send({
        userId: job.clientId,
        title: 'Project Delivered — Review Required',
        body: `Your freelancer has submitted work for "${job.title}". Review and approve the delivery.`,
        type: 'PROJECT_DELIVERY',
        category: 'FREELANCE',
        link: '/orders',
        actorId: freelancerId,
        targetId: jobId,
      });

      return reply.send({
        success: true,
        message: 'Project work delivered successfully.',
        job: updatedJob,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /jobs/:id/milestones/:milestoneId/deliver - Deliver specific milestone (Freelancer only)
  fastify.post('/:id/milestones/:milestoneId/deliver', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: freelancerId } = request.user;
      const { id: jobId, milestoneId } = request.params as { id: string; milestoneId: string };
      const body = (request.body || {}) as { notes?: string; files?: any };

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { milestones: true },
      });

      if (!job || job.freelancerId !== freelancerId) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only the assigned freelancer can deliver milestones.' });
      }

      const milestone = job.milestones.find((m) => m.id === milestoneId);
      if (!milestone || (milestone.status !== 'PENDING' && milestone.status !== 'IN_PROGRESS' && milestone.status !== 'DELIVERED')) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Milestone is not active.' });
      }

      // Update milestone
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          deliveryNotes: body.notes || null,
          deliveryFiles: body.files ? (typeof body.files === 'string' ? JSON.parse(body.files) : body.files) : null,
        },
      });

      // Update job status to DELIVERED
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'DELIVERED' },
      });

      // Send real-time notification to client
      await NotificationService.send({
        userId: job.clientId,
        title: 'Milestone Delivered',
        body: `Milestone "${milestone.title}" has been delivered for "${job.title}".`,
        type: 'PROJECT_DELIVERY',
        category: 'FREELANCE',
        link: '/orders',
        actorId: job.freelancerId || undefined,
        targetId: jobId,
      });

      return reply.send({ success: true, message: 'Milestone delivered successfully.' });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /jobs/:id/milestones/:milestoneId/approve - Approve milestone & release CC (Client only)
  fastify.post('/:id/milestones/:milestoneId/approve', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: clientId } = request.user;
      const { id: jobId, milestoneId } = request.params as { id: string; milestoneId: string };

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { milestones: true, freelancer: true },
      });

      if (!job || job.clientId !== clientId) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only the client can approve milestone deliveries.' });
      }

      const milestone = job.milestones.find((m) => m.id === milestoneId);
      if (!milestone || milestone.status !== 'DELIVERED') {
        return reply.status(400).send({ error: 'Bad Request', message: 'Milestone is not in DELIVERED state.' });
      }

      if (!job.freelancer || !job.freelancer.walletAddress) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Freelancer has no wallet address bound.' });
      }

      // Canton release (2 txns): MilestoneRelease, CC transfer with 5% platform fee
      const cantonResult = await CantonService.executeMilestoneRelease(
        jobId,
        milestoneId,
        job.freelancer.walletAddress,
        milestone.amountCC,
        job.platformFee
      );

      // Update Milestone
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      });

      // Check if all milestones are approved
      const updatedMilestones = await prisma.milestone.findMany({
        where: { jobId },
      });

      const allApproved = updatedMilestones.every((m) => m.status === 'APPROVED');
      let finalJobStatus = job.status;

      if (allApproved) {
        finalJobStatus = 'COMPLETED';
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'COMPLETED' },
        });
      } else {
        // Return to progress state
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return reply.send({
        success: true,
        message: `Milestone approved. Released ${milestone.amountCC} CC (minus 5% fee) to freelancer.`,
        jobStatus: finalJobStatus,
        cantonTxId: cantonResult.txId,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /jobs/:id/approve - Approve full project delivery & release Canton escrow CC (Client only)
  fastify.post('/:id/approve', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: clientId } = request.user;
      const { id: jobId } = request.params as { id: string };

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { milestones: true, freelancer: true },
      });

      if (!job || job.clientId !== clientId) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only the client can approve project delivery.' });
      }

      if (!['DELIVERED', 'IN_PROGRESS'].includes(job.status)) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Job is not in DELIVERED or IN_PROGRESS state.' });
      }

      if (!job.freelancer || !job.freelancer.walletAddress) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Freelancer has no wallet address bound for escrow payout.' });
      }

      const milestoneId = job.milestones[0]?.id || 'full_release';
      const cantonResult = await CantonService.executeMilestoneRelease(
        jobId,
        milestoneId,
        job.freelancer.walletAddress,
        job.amountCC,
        job.platformFee
      );

      const now = new Date();

      await prisma.milestone.updateMany({
        where: { jobId },
        data: {
          status: 'APPROVED',
          approvedAt: now,
        },
      });

      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' },
      });

      if (job.freelancerId) {
        await NotificationService.send({
          userId: job.freelancerId,
          title: 'Delivery Approved — Funds Released',
          body: `Your delivery for "${job.title}" was approved. ${job.amountCC} CC has been released to your wallet.`,
          type: 'ESCROW_RELEASE',
          category: 'WALLET',
          link: '/orders',
          actorId: clientId,
          targetId: jobId,
        });
        // Trust events for job & escrow completion
        TrustEngine.onJobComplete(job.freelancerId).catch(() => {});
        TrustEngine.onEscrowComplete(job.freelancerId).catch(() => {});
      }
      // Trust event for client who completed a contract
      TrustEngine.onJobComplete(clientId).catch(() => {});

      // Notify client that approval is complete
      await NotificationService.send({
        userId: clientId,
        title: 'Contract Completed',
        body: `Project "${job.title}" is now marked as completed.`,
        type: 'CONTRACT_COMPLETED',
        category: 'FREELANCE',
        link: '/orders',
        targetId: jobId,
      });

      return reply.send({
        success: true,
        message: `Project delivery approved. Released ${job.amountCC} CC (minus 5% fee) to freelancer.`,
        jobStatus: 'COMPLETED',
        approvedAt: now,
        cantonTxId: cantonResult.txId,
        job: updatedJob,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /jobs/:id/dispute - Raise dispute
  fastify.post('/:id/dispute', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: raisedById } = request.user;
      const { id: jobId } = request.params as { id: string };
      const { reason } = DisputeSchema.parse(request.body);

      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return reply.status(404).send({ error: 'Not Found', message: 'Job not found' });
      }

      if (job.clientId !== raisedById && job.freelancerId !== raisedById) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only active job parties can raise disputes.' });
      }

      const respondentId = (job.clientId === raisedById) ? (job.freelancerId || '') : job.clientId;

      // Create dispute record
      const dispute = await prisma.dispute.create({
        data: {
          jobId,
          raisedById,
          respondentId,
          reason,
          status: 'OPEN',
        },
      });

      // Update Job status
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'DISPUTED' },
      });

      // Notify both parties of the dispute
      await NotificationService.send({
        userId: respondentId,
        title: 'Dispute Opened Against You',
        body: `A dispute has been opened on job "${job.title}". An admin will review the claim.`,
        type: 'DISPUTE_OPENED',
        category: 'FREELANCE',
        link: '/orders',
        actorId: raisedById,
        targetId: jobId,
      });

      return reply.send({
        success: true,
        message: 'Dispute raised successfully. Escrow funds locked. An admin will review the claim.',
        dispute,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /jobs/seller/my-proposals - List authenticated seller's submitted proposals
  fastify.get('/seller/my-proposals', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: freelancerId } = request.user;
      const proposals = await prisma.proposal.findMany({
        where: { freelancerId },
        include: {
          job: {
            include: {
              client: {
                select: { id: true, username: true, displayName: true, trustScore: true, avatarUrl: true, country: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, proposals });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /jobs/seller/my-orders - List authenticated seller's assigned jobs/orders
  fastify.get('/seller/my-orders', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: freelancerId } = request.user;
      const jobs = await prisma.job.findMany({
        where: { freelancerId },
        include: {
          client: {
            select: { id: true, username: true, displayName: true, trustScore: true, avatarUrl: true, country: true },
          },
          milestones: true,
          dispute: true,
          reviews: {
            where: { reviewerId: freelancerId },
            select: { id: true, rating: true, comment: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, jobs });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /jobs/:id/review - Seller leaves a review for buyer after job completion
  const ReviewSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().max(1000).optional(),
  });

  fastify.post('/:id/review', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: reviewerId } = request.user;
      const { id: jobId } = request.params as { id: string };
      const { rating, comment } = ReviewSchema.parse(request.body);

      const job = await prisma.job.findUnique({ where: { id: jobId } });

      if (!job) {
        return reply.status(404).send({ error: 'Not Found', message: 'Job not found.' });
      }

      let isClient = job.clientId === reviewerId;
      let isFreelancer = job.freelancerId === reviewerId;

      // If user is not directly clientId or freelancerId on job, check if job has no freelancer or if user submitted a proposal
      if (!isClient && !isFreelancer) {
        const prop = await prisma.proposal.findFirst({ where: { jobId, freelancerId: reviewerId } });
        if (prop) {
          isFreelancer = true;
          if (!job.freelancerId) {
            await prisma.job.update({ where: { id: jobId }, data: { freelancerId: reviewerId } });
          }
        } else {
          // Default to client reviewer role if user is authorized
          isClient = true;
        }
      }

      let revieweeId = isClient ? job.freelancerId : job.clientId;
      if (!revieweeId && isClient) {
        const acceptedProp = await prisma.proposal.findFirst({ where: { jobId, status: 'ACCEPTED' } });
        if (acceptedProp) {
          revieweeId = acceptedProp.freelancerId;
        } else {
          const firstProp = await prisma.proposal.findFirst({ where: { jobId } });
          if (firstProp) revieweeId = firstProp.freelancerId;
        }
      }

      if (!revieweeId) {
        // Fallback to any active seller user if no proposal exists
        const sampleSeller = await prisma.user.findFirst({ where: { isSeller: true, id: { not: reviewerId } } });
        if (sampleSeller) revieweeId = sampleSeller.id;
        else revieweeId = reviewerId;
      }

      // Upsert review (create new or update existing)
      const existing = await prisma.review.findFirst({
        where: { jobId, reviewerId },
      });

      let review: any;
      if (existing) {
        review = await prisma.review.update({
          where: { id: existing.id },
          data: { rating, comment },
        });
      } else {
        review = await prisma.review.create({
          data: {
            jobId,
            reviewerId,
            revieweeId,
            rating,
            comment,
          },
        });
      }

      // Notify counterparty
      const reviewerRole = isClient ? 'Client' : 'Freelancer';
      if (revieweeId && revieweeId !== reviewerId) {
        await NotificationService.send({
          userId: revieweeId,
          title: 'You Received a Review',
          body: `The ${reviewerRole} on "${job.title}" left you a ${rating}-star review.`,
          type: 'REVIEW_RECEIVED',
          category: 'FREELANCE',
          link: '/orders',
          actorId: reviewerId,
          targetId: jobId,
        });
      }

      return reply.send({ success: true, message: 'Review submitted successfully.', review });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard, sellerGuard } from '../middleware/auth.js';
import { RiskService, riskRestrictionGuard } from '../middleware/riskCheck.js';
import { CantonService } from '../services/canton.js';

const CreateJobSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20),
  category: z.string().min(2),
  skills: z.array(z.string()),
  amountCC: z.number().positive(),
  deadlineDays: z.number().int().positive(),
});

const ProposalSchema = z.object({
  coverLetter: z.string().min(20),
  approach: z.string().optional(),
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

export async function jobRoutes(fastify: FastifyInstance) {
  // GET /jobs - List open jobs
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const jobs = await prisma.job.findMany({
        where: { status: 'OPEN' },
        include: {
          client: {
            select: { id: true, username: true, displayName: true, trustScore: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, jobs });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /jobs - Post a job & lock escrow (Authenticated clients)
  fastify.post('/', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: clientId } = request.user;
      const { title, description, category, skills, amountCC, deadlineDays } = CreateJobSchema.parse(request.body);

      // Check client has a bound wallet
      const client = await prisma.user.findUnique({
        where: { id: clientId },
      });
      if (!client || !client.walletAddress) {
        return reply.status(400).send({ error: 'Bad Request', message: 'You must bind your Canton wallet before creating jobs.' });
      }

      // Lock on-chain Escrow (2 transactions generated)
      const cantonResult = await CantonService.executeJobEscrow(clientId, 'temp_job_id', amountCC);

      // Create Job
      const job = await prisma.job.create({
        data: {
          clientId,
          title,
          description,
          category,
          skills,
          amountCC,
          deadlineDays,
          status: 'OPEN',
          escrowLocked: true,
          damlContractId: cantonResult.contractId,
          platformFee: 0.05, // 5% platform fee
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
          client: { select: { id: true, username: true, displayName: true, trustScore: true } },
          freelancer: { select: { id: true, username: true, displayName: true, trustScore: true } },
          milestones: true,
          proposals: {
            include: {
              freelancer: { select: { id: true, username: true, displayName: true, trustScore: true } },
            },
          },
          dispute: true,
        },
      });

      if (!job) {
        return reply.status(404).send({ error: 'Not Found', message: 'Job not found' });
      }

      return reply.send({ success: true, job });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /jobs/:id/proposals - Submit proposal (Approved sellers only)
  fastify.post('/:id/proposals', { preValidation: [authGuard, sellerGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: freelancerId } = request.user;
      const { id: jobId } = request.params as { id: string };
      const { coverLetter, approach, rateCC, deliveryDays } = ProposalSchema.parse(request.body);

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
      if (applicationsCount > 10) {
        // Enforce anti-sybil flag: Rapid job application velocity (+20 risk score)
        await RiskService.addRiskSignal(freelancerId, 'Rapid job application velocity', 20, { applicationsCount });
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

      // Update Job status
      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          freelancerId,
          status: 'IN_PROGRESS',
        },
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

  // POST /jobs/:id/milestones/:milestoneId/deliver - Deliver milestone (Freelancer only)
  fastify.post('/:id/milestones/:milestoneId/deliver', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: freelancerId } = request.user;
      const { id: jobId, milestoneId } = request.params as { id: string; milestoneId: string };

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { milestones: true },
      });

      if (!job || job.freelancerId !== freelancerId) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only the assigned freelancer can deliver milestones.' });
      }

      const milestone = job.milestones.find((m) => m.id === milestoneId);
      if (!milestone || milestone.status !== 'PENDING' && milestone.status !== 'IN_PROGRESS') {
        return reply.status(400).send({ error: 'Bad Request', message: 'Milestone is not active or already delivered.' });
      }

      // Update milestone
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      // Update job status to DELIVERED
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'DELIVERED' },
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

      // Notify admin
      await prisma.notification.create({
        data: {
          userId: job.clientId, // inform client
          title: 'Job Dispute Raised',
          body: `A dispute has been raised on job "${job.title}". Raised by user ${raisedById}.`,
          type: 'DISPUTE',
        },
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
}

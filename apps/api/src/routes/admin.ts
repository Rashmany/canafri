import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard, roleGuard } from '../middleware/auth.js';
import { CantonService } from '../services/canton.js';
import { RiskService } from '../middleware/riskCheck.js';

const SuspendUserSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
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

const UpdateConfigSchema = z.object({
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

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require ADMIN or SUPER_ADMIN roles
  fastify.addHook('preValidation', authGuard);
  fastify.addHook('preHandler', roleGuard(['ADMIN', 'SUPER_ADMIN']));

  // GET /admin/users - List all users
  fastify.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, users });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /admin/users/:id/suspend - Update user status (suspend/ban)
  fastify.patch('/users/:id/suspend', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { status } = SuspendUserSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { status },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          adminId: request.user.userId,
          action: 'UPDATE_USER_STATUS',
          target: id,
          before: JSON.stringify({ status: user.status }),
          after: JSON.stringify({ status: updatedUser.status }),
        },
      });

      // Revoke sessions if suspended/banned
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
      await prisma.auditLog.create({
        data: {
          adminId: request.user.userId,
          action: `CONTENT_${status}`,
          target: id,
          before: JSON.stringify({ status: content.status }),
          after: JSON.stringify({ status: updatedContent.status }),
        },
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
      await prisma.auditLog.create({
        data: {
          adminId: request.user.userId,
          action: 'RESOLVE_DISPUTE',
          target: id,
          before: JSON.stringify({ status: dispute.status }),
          after: JSON.stringify({ status: updatedDispute.status, clientPct, freelancerPct }),
        },
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
        await prisma.auditLog.create({
          data: {
            adminId,
            action: 'TREASURY_WITHDRAWAL',
            target: destinationWallet,
            before: JSON.stringify({ balance: currentBalance }),
            after: JSON.stringify({ balance: finalBalance, withdrawnAmount: amountCC, signers }),
          },
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

  // GET /admin/config - Get platform configuration
  fastify.get('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let config = await prisma.platformConfig.findFirst();
      if (!config) {
        config = await prisma.platformConfig.create({
          data: {},
        });
      }
      return reply.send({ success: true, config });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /admin/config - Update platform config (Audit logged before/after)
  fastify.patch('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const configData = UpdateConfigSchema.parse(request.body);
      const adminId = request.user.userId;

      let currentConfig = await prisma.platformConfig.findFirst();
      if (!currentConfig) {
        currentConfig = await prisma.platformConfig.create({ data: {} });
      }

      const updatedConfig = await prisma.platformConfig.update({
        where: { id: currentConfig.id },
        data: {
          ...configData,
          updatedBy: adminId,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE_PLATFORM_CONFIG',
          target: currentConfig.id,
          before: JSON.stringify(currentConfig),
          after: JSON.stringify(updatedConfig),
        },
      });

      return reply.send({ success: true, config: updatedConfig });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard, roleGuard } from '../middleware/auth.js';
import { HashService } from '../lib/hash.js';
import { AuditService } from '../services/audit.js';
import { CantonService } from '../services/canton.js';
import { RiskService } from '../middleware/riskCheck.js';

const SuspendUserSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
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
        userId: callerId,
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
        userId: callerId,
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
        userId: callerId,
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

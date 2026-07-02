import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard } from '../middleware/auth.js';

export async function walletRoutes(fastify: FastifyInstance) {
  fastify.addHook('preValidation', authGuard);

  // GET /wallet/balance - Retrieve wallet balance (from simulated Canton ledger)
  fastify.get('/balance', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      if (!user.walletAddress) {
        return reply.send({
          success: true,
          walletBound: false,
          balanceCC: 0,
          message: 'No wallet bound to this account. Please bind a Canton wallet.',
        });
      }

      // Query mock Canton balance from Redis (Seed with 500 CC if first time check)
      const balanceKey = `canton_balance:${userId}`;
      let balanceStr = await redis.get(balanceKey);
      
      if (!balanceStr) {
        // Seed default 500 CC for development testing
        const initialDevBalance = 500.0;
        await redis.set(balanceKey, initialDevBalance.toString());
        balanceStr = initialDevBalance.toString();
      }

      const balanceCC = parseFloat(balanceStr);

      // Also calculate locked balances
      const activeCreatorStake = await prisma.creatorStake.findFirst({
        where: { userId, status: 'LOCKED' },
      });

      const activeReadStakes = await prisma.readStake.aggregate({
        where: { userId, status: 'STAKED' },
        _sum: { amountCC: true },
      });

      const activeEscrowAsClient = await prisma.job.aggregate({
        where: { clientId: userId, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'DISPUTED'] } },
        _sum: { amountCC: true },
      });

      return reply.send({
        success: true,
        walletBound: true,
        walletAddress: user.walletAddress,
        availableBalanceCC: balanceCC,
        lockedBalanceCC: {
          creatorStakeCC: activeCreatorStake ? activeCreatorStake.amountCC : 0,
          readStakesCC: activeReadStakes._sum.amountCC || 0,
          escrowLockedCC: activeEscrowAsClient._sum.amountCC || 0,
        },
        totalBalanceCC: balanceCC + 
          (activeCreatorStake ? activeCreatorStake.amountCC : 0) + 
          (activeReadStakes._sum.amountCC || 0) + 
          (activeEscrowAsClient._sum.amountCC || 0),
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /wallet/transactions - Retrieve transaction log list
  fastify.get('/transactions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      
      // We will compile a list of ledger events by reading table records associated with the user
      const transactions: any[] = [];

      // 1. Subscriptions
      const sub = await prisma.subscription.findUnique({
        where: { userId },
      });
      if (sub) {
        transactions.push({
          id: `tx_sub_${sub.id}`,
          type: 'SUBSCRIPTION',
          amountCC: -sub.amountCC,
          status: sub.status,
          date: sub.createdAt,
          description: `Monthly subscription split: ${sub.poolAllocationCC} CC to pool, ${sub.stakeBalanceCC} CC to stake balance.`,
        });
      }

      // 2. Creator stakes
      const crStakes = await prisma.creatorStake.findMany({
        where: { userId },
      });
      for (const stake of crStakes) {
        transactions.push({
          id: `tx_cr_${stake.id}`,
          type: 'CREATOR_STAKE',
          amountCC: -stake.amountCC,
          status: stake.status,
          date: stake.createdAt,
          description: `Creator stake contract created (Locked: ${stake.status}).`,
        });
      }

      // 3. Read stakes
      const rdStakes = await prisma.readStake.findMany({
        where: { userId },
        include: { content: true },
      });
      for (const stake of rdStakes) {
        transactions.push({
          id: `tx_rd_${stake.id}`,
          type: 'READ_STAKE',
          amountCC: stake.status === 'FORFEITED' ? -stake.amountCC : 0, // 0 if unstaked successfully
          status: stake.status,
          date: stake.stakedAt,
          description: `Read stake for "${stake.content.title}". Status: ${stake.status}.`,
        });
      }

      // 4. Job escrow deposits (Client)
      const clientJobs = await prisma.job.findMany({
        where: { clientId: userId },
      });
      for (const job of clientJobs) {
        transactions.push({
          id: `tx_job_escrow_${job.id}`,
          type: 'ESCROW_LOCK',
          amountCC: -job.amountCC,
          status: job.escrowLocked ? 'LOCKED' : 'RELEASED',
          date: job.createdAt,
          description: `Job escrow lock for "${job.title}".`,
        });
      }

      // 5. Milestone payouts (Freelancer)
      const freelancerJobs = await prisma.job.findMany({
        where: { freelancerId: userId },
        include: { milestones: true },
      });
      for (const job of freelancerJobs) {
        const approvedMilestones = job.milestones.filter(m => m.status === 'APPROVED');
        for (const ms of approvedMilestones) {
          const fee = ms.amountCC * job.platformFee;
          const payout = ms.amountCC - fee;
          transactions.push({
            id: `tx_payout_${ms.id}`,
            type: 'MILESTONE_PAYOUT',
            amountCC: payout,
            status: 'RECEIVED',
            date: ms.approvedAt || ms.createdAt,
            description: `Payout for milestone "${ms.title}" on job "${job.title}" (5% fee deducted).`,
          });
        }
      }

      // Sort transactions descending by date
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return reply.send({ success: true, transactions });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}

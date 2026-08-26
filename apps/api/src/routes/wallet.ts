import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard } from '../middleware/auth.js';
import { CantonService } from '../services/canton.js';

const ConnectWalletSchema = z.object({
  walletType: z.string().min(1),
  address: z.string().optional(),
});

const DepositSchema = z.object({
  coin: z.enum(['CC', 'USDCx']),
  amount: z.number().positive(),
});

const WithdrawSchema = z.object({
  coin: z.enum(['CC', 'USDCx']),
  amount: z.number().positive(),
  destinationAddress: z.string().min(5),
});

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

      // Query mock Canton balance from Redis (Seed with 500 CC if first time check)
      const balanceKey = `canton_balance:${userId}`;
      let balanceStr = await redis.get(balanceKey);

      if (!balanceStr) {
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
        where: { clientId: userId, status: { in: ['ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'DISPUTED'] } },
        _sum: { amountCC: true },
      });

      const creatorStakeCC = activeCreatorStake ? activeCreatorStake.amountCC : 0;
      const readStakesCC = activeReadStakes._sum.amountCC || 0;
      const escrowLockedCC = activeEscrowAsClient._sum.amountCC || 0;
      const totalLockedCC = creatorStakeCC + readStakesCC + escrowLockedCC;

      return reply.send({
        success: true,
        walletBound: !!user.walletAddress,
        walletAddress: user.walletAddress || null,
        availableBalanceCC: balanceCC,
        lockedBalanceCC: {
          creatorStakeCC,
          readStakesCC,
          escrowLockedCC,
          totalLockedCC,
        },
        totalBalanceCC: balanceCC + totalLockedCC,
        usdRate: 0.15,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /wallet/connect - Bind a wallet to the user's account
  fastify.post('/connect', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { walletType, address } = ConnectWalletSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      // Generate realistic Canton or Ethereum-style address if none supplied
      const randomHex = Math.random().toString(36).substring(2, 8);
      const generatedAddress = address || `0x${userId.slice(-6)}${randomHex}..${walletType.slice(0, 3).toLowerCase()}`;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          walletAddress: generatedAddress,
          walletBoundAt: new Date(),
        },
      });

      // Ensure balance exists
      const balanceKey = `canton_balance:${userId}`;
      let balanceStr = await redis.get(balanceKey);
      if (!balanceStr) {
        await redis.set(balanceKey, '500');
        balanceStr = '500';
      }

      return reply.send({
        success: true,
        message: `${walletType} successfully connected`,
        walletAddress: updatedUser.walletAddress,
        availableBalanceCC: parseFloat(balanceStr),
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /wallet/disconnect - Unbind wallet
  fastify.post('/disconnect', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;

      await prisma.user.update({
        where: { id: userId },
        data: {
          walletAddress: null,
          walletBoundAt: null,
        },
      });

      return reply.send({
        success: true,
        message: 'Wallet disconnected',
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /wallet/deposit - Perform deposit to Canton balance
  fastify.post('/deposit', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { coin, amount } = DepositSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      const balanceKey = `canton_balance:${userId}`;
      let currentBalance = parseFloat((await redis.get(balanceKey)) || '500');
      const newBalance = currentBalance + amount;
      await redis.set(balanceKey, newBalance.toString());

      // Record transaction in Redis ledger
      const txId = `tx_dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const txRecord = {
        id: txId,
        type: 'receive',
        label: `Deposit ${coin}`,
        address: user.walletAddress || `To ${userId.slice(0, 6)}...`,
        amount: `+${amount.toFixed(amount % 1 === 0 ? 0 : 2)} ${coin}`,
        rawAmount: amount,
        usd: `$${(amount * 0.15).toFixed(2)}`,
        positive: true,
        status: 'Completed',
        date: new Date().toISOString(),
        fromAddress: 'External Gateway / Canton Onramp',
        toAddress: user.walletAddress || `Canton Account (${userId.slice(0, 6)})`,
        description: `Deposit of ${amount} ${coin} credited to available balance.`,
        network: 'Canton',
        txHash: `0x${Math.random().toString(16).substring(2, 18)}...`,
      };

      const customTxsKey = `canton_txs:${userId}`;
      await redis.lPush(customTxsKey, JSON.stringify(txRecord));

      return reply.send({
        success: true,
        message: `Successfully deposited ${amount} ${coin}`,
        newBalance,
        transaction: txRecord,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /wallet/withdraw - Perform withdrawal from Canton balance
  fastify.post('/withdraw', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { coin, amount, destinationAddress } = WithdrawSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      const networkFee = 0.23;
      const totalDeduction = amount + networkFee;

      const balanceKey = `canton_balance:${userId}`;
      let currentBalance = parseFloat((await redis.get(balanceKey)) || '500');

      if (currentBalance < totalDeduction) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: `Insufficient balance. You need ${totalDeduction.toFixed(2)} ${coin} (including 0.23 fee), but only have ${currentBalance.toFixed(2)} ${coin}.`,
        });
      }

      const newBalance = currentBalance - totalDeduction;
      await redis.set(balanceKey, newBalance.toString());

      // Record transaction in Redis ledger
      const txId = `tx_wth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const txRecord = {
        id: txId,
        type: 'send',
        label: `Withdraw ${coin}`,
        address: `To ${destinationAddress.slice(0, 8)}...`,
        amount: `-${amount.toFixed(amount % 1 === 0 ? 0 : 2)} ${coin}`,
        rawAmount: -amount,
        usd: `$${(amount * 0.15).toFixed(2)}`,
        positive: false,
        status: 'Completed',
        date: new Date().toISOString(),
        fromAddress: user.walletAddress || `Canton Account (${userId.slice(0, 6)})`,
        toAddress: destinationAddress,
        description: `Withdrawal of ${amount} ${coin} with ${networkFee} CC network fee.`,
        network: 'Canton',
        txHash: `0x${Math.random().toString(16).substring(2, 18)}...`,
      };

      const customTxsKey = `canton_txs:${userId}`;
      await redis.lPush(customTxsKey, JSON.stringify(txRecord));

      return reply.send({
        success: true,
        message: `Successfully withdrew ${amount} ${coin}`,
        newBalance,
        transaction: txRecord,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /wallet/transactions - Retrieve unified transaction log list
  fastify.get('/transactions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const transactions: any[] = [];

      // 1. Custom deposits and withdrawals stored in Redis
      const customTxsKey = `canton_txs:${userId}`;
      const customTxsRaw = await redis.lRange(customTxsKey, 0, 50);
      for (const item of customTxsRaw) {
        try {
          const parsed = JSON.parse(item);
          transactions.push(parsed);
        } catch {}
      }

      // 2. Subscriptions
      const sub = await prisma.subscription.findUnique({
        where: { userId },
      });
      if (sub) {
        transactions.push({
          id: `tx_sub_${sub.id}`,
          type: 'send',
          label: 'Subscription',
          address: 'CanaFri Content Pool',
          amount: `-${sub.amountCC} CC`,
          rawAmount: -sub.amountCC,
          usd: `$${(sub.amountCC * 0.15).toFixed(2)}`,
          positive: false,
          status: sub.status === 'ACTIVE' ? 'Active' : sub.status,
          date: sub.createdAt.toISOString(),
          fromAddress: `User (${userId.slice(0, 6)})`,
          toAddress: 'CanaFri Platform Pool',
          description: `Monthly subscription split: ${sub.poolAllocationCC} CC to pool, ${sub.stakeBalanceCC} CC to stake balance.`,
          network: 'Canton',
          txHash: sub.damlContractId || `0x${sub.id.slice(0, 16)}`,
        });
      }

      // 3. Creator stakes
      const crStakes = await prisma.creatorStake.findMany({
        where: { userId },
      });
      for (const stake of crStakes) {
        transactions.push({
          id: `tx_cr_${stake.id}`,
          type: 'send',
          label: 'Creator Stake',
          address: 'Creator Stake Contract',
          amount: `-${stake.amountCC} CC`,
          rawAmount: -stake.amountCC,
          usd: `$${(stake.amountCC * 0.15).toFixed(2)}`,
          positive: false,
          status: stake.status,
          date: stake.createdAt.toISOString(),
          fromAddress: `User (${userId.slice(0, 6)})`,
          toAddress: 'Creator Stake Escrow',
          description: `Creator stake contract created (Locked: ${stake.status}).`,
          network: 'Canton',
          txHash: stake.damlContractId || `0x${stake.id.slice(0, 16)}`,
        });
      }

      // 4. Read stakes
      const rdStakes = await prisma.readStake.findMany({
        where: { userId },
        include: { content: true },
      });
      for (const stake of rdStakes) {
        const isForfeited = stake.status === 'FORFEITED';
        const isUnstaked = stake.status === 'UNSTAKED';
        transactions.push({
          id: `tx_rd_${stake.id}`,
          type: isUnstaked ? 'receive' : 'send',
          label: isUnstaked ? 'Stake Returned' : 'Read Stake',
          address: `Content: ${stake.content.title.slice(0, 15)}...`,
          amount: isUnstaked ? `+${stake.amountCC} CC` : `-${stake.amountCC} CC`,
          rawAmount: isUnstaked ? stake.amountCC : -stake.amountCC,
          usd: `$${(stake.amountCC * 0.15).toFixed(2)}`,
          positive: isUnstaked,
          status: stake.status,
          date: (stake.unstakedAt || stake.stakedAt).toISOString(),
          fromAddress: isUnstaked ? 'Read Stake Contract' : `User (${userId.slice(0, 6)})`,
          toAddress: isUnstaked ? `User (${userId.slice(0, 6)})` : 'Read Stake Contract',
          description: `Read stake for "${stake.content.title}". Status: ${stake.status}.`,
          network: 'Canton',
          txHash: stake.damlContractId || `0x${stake.id.slice(0, 16)}`,
        });
      }

      // 5. Job escrow deposits (Client)
      const clientJobs = await prisma.job.findMany({
        where: { clientId: userId },
      });
      for (const job of clientJobs) {
        transactions.push({
          id: `tx_job_escrow_${job.id}`,
          type: 'send',
          label: 'Escrow Lock',
          address: `Job: ${job.title.slice(0, 16)}...`,
          amount: `-${job.amountCC} CC`,
          rawAmount: -job.amountCC,
          usd: `$${(job.amountCC * 0.15).toFixed(2)}`,
          positive: false,
          status: job.status,
          date: job.createdAt.toISOString(),
          fromAddress: `Client (${userId.slice(0, 6)})`,
          toAddress: 'Job Escrow Contract',
          description: `Job escrow lock for "${job.title}".`,
          network: 'Canton',
          txHash: job.damlContractId || `0x${job.id.slice(0, 16)}`,
        });
      }

      // 6. Milestone payouts (Freelancer)
      const freelancerJobs = await prisma.job.findMany({
        where: { freelancerId: userId },
        include: { milestones: true },
      });
      for (const job of freelancerJobs) {
        const approvedMilestones = job.milestones.filter((m) => m.status === 'APPROVED');
        for (const ms of approvedMilestones) {
          const fee = ms.amountCC * job.platformFee;
          const payout = ms.amountCC - fee;
          transactions.push({
            id: `tx_payout_${ms.id}`,
            type: 'receive',
            label: 'Milestone Payout',
            address: `From: ${job.title.slice(0, 15)}...`,
            amount: `+${payout.toFixed(payout % 1 === 0 ? 0 : 2)} CC`,
            rawAmount: payout,
            usd: `$${(payout * 0.15).toFixed(2)}`,
            positive: true,
            status: 'Completed',
            date: (ms.approvedAt || ms.createdAt).toISOString(),
            fromAddress: 'Escrow Contract',
            toAddress: `Freelancer (${userId.slice(0, 6)})`,
            description: `Payout for milestone "${ms.title}" on job "${job.title}" (5% platform fee deducted).`,
            network: 'Canton',
            txHash: `0x${ms.id.slice(0, 16)}`,
          });
        }
      }

      // Format date groups and sort descending
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Assign date groups like "Today", "Yesterday", "Jun 29, 2026"
      const now = new Date();
      const todayStr = now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      let lastDateGroup = '';
      const formattedTransactions = transactions.map((tx, idx) => {
        const txDate = new Date(tx.date);
        let group = '';
        if (txDate.toDateString() === todayStr) {
          group = 'Today';
        } else if (txDate.toDateString() === yesterdayStr) {
          group = 'Yesterday';
        } else {
          group = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        const showGroup = group !== lastDateGroup;
        lastDateGroup = group;

        return {
          ...tx,
          dateGroup: showGroup ? group : undefined,
        };
      });

      return reply.send({ success: true, transactions: formattedTransactions });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}

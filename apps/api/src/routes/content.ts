import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard, creatorGuard } from '../middleware/auth.js';
import { RiskService, riskRestrictionGuard } from '../middleware/riskCheck.js';
import { CantonService } from '../services/canton.js';
import { NotificationService } from '../services/notification.js';

const CreateContentSchema = z.object({
  title: z.string().min(3).max(100),
  bodyIpfsHash: z.string().min(5),
  type: z.enum(['FREE', 'PREMIUM']),
  priceCC: z.number().nonnegative().default(0),
  topic: z.string().optional(),
  publication: z.string().optional(),
});

export async function contentRoutes(fastify: FastifyInstance) {
  // GET /content - List public/live content + authenticated user's own posts (any status)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Try to resolve current user from token (optional auth)
      let myUserId: string | null = null;
      try {
        const authHeader = (request.headers as any).authorization as string | undefined;
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.slice(7);
          const decoded = (fastify.jwt as any).decode(token) as any;
          // Handle both token formats: new tokens use `sub`, legacy use `userId`
          if (decoded?.sub) myUserId = decoded.sub;
          else if (decoded?.userId) myUserId = decoded.userId;
        }
      } catch (_) { /* unauthenticated — fine */ }

      const content = await prisma.content.findMany({
        where: {
          OR: [
            { status: 'LIVE' },
            // Show the authenticated creator's own posts in any status
            ...(myUserId ? [{ creatorId: myUserId }] : []),
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, content });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /content - Create content (Creators only)
  fastify.post('/', { preValidation: [authGuard, creatorGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { title, bodyIpfsHash, type, priceCC, topic, publication } = CreateContentSchema.parse(request.body);

      // 1. Ensure Creator Stake exists or auto-create active stake for publishing
      let creatorStake = await prisma.creatorStake.findUnique({
        where: { userId },
      });

      if (!creatorStake) {
        const unlockAt = new Date();
        unlockAt.setDate(unlockAt.getDate() + 30); // 30-day lock period
        creatorStake = await prisma.creatorStake.create({
          data: {
            userId,
            amountCC: 250.0,
            status: 'LOCKED',
            lockedAt: new Date(),
            unlockAt,
          },
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { isCreator: true },
      });

      // Create content record as PENDING for manual admin verification (ALL content on platform is PREMIUM 5 CC)
      const content = await prisma.content.create({
        data: {
          creatorId: userId,
          title,
          bodyIpfsHash,
          type: 'PREMIUM',
          priceCC: 5.0,
          topic: topic || null,
          publication: publication || null,
          status: 'PENDING',
          aiScore: 0,
        },
      });

      return reply.send({
        success: true,
        message: 'Content submitted successfully and is PENDING admin review.',
        content,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /content/:id - Get content details
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const content = await prisma.content.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              trustScore: true,
            },
          },
        },
      });

      if (!content) {
        return reply.status(404).send({ error: 'Not Found', message: 'Content not found' });
      }

      return reply.send({ success: true, content });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /content/:id/replies - List replies for a content post (public)
  fastify.get('/:id/replies', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id: contentId } = request.params as { id: string };
      const replies = await prisma.contentReply.findMany({
        where: { contentId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, replies });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /content/:id/replies - Post a reply (authenticated users)
  fastify.post('/:id/replies', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { id: contentId } = request.params as { id: string };
      const { body } = request.body as { body: string };

      if (!body || body.trim().length === 0) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Reply body cannot be empty.' });
      }
      if (body.length > 2000) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Reply body must be under 2000 characters.' });
      }

      const content = await prisma.content.findUnique({ where: { id: contentId } });
      if (!content || content.status !== 'LIVE') {
        return reply.status(404).send({ error: 'Not Found', message: 'Content not found or not live.' });
      }

      const newReply = await prisma.contentReply.create({
        data: { contentId, authorId: userId, body: body.trim() },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Notify content creator about the comment (skip if commenter is the creator)
      if (content.creatorId !== userId) {
        await NotificationService.send({
          userId: content.creatorId,
          title: 'New Comment on Your Post',
          body: `Someone commented on "${content.title}".`,
          type: 'CONTENT_REPLY',
          category: 'COMMUNITY',
          link: `/community`,
          actorId: userId,
          targetId: contentId,
        });
      }

      return reply.status(201).send({ success: true, reply: newReply });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /content/:id/stake - Stake 5 CC to start reading premium content
  fastify.post('/:id/stake', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { id: contentId } = request.params as { id: string };

      // 1. Verify content exists and is Premium
      const content = await prisma.content.findUnique({
        where: { id: contentId },
      });

      if (!content) {
        return reply.status(404).send({ error: 'Not Found', message: 'Content not found' });
      }

      // Auto-upgrade content to PREMIUM if previously stored as FREE
      if (content.type !== 'PREMIUM') {
        await prisma.content.update({
          where: { id: contentId },
          data: { type: 'PREMIUM', priceCC: 5.0 },
        });
      }

      // Check if user already has an active stake for this content
      const existingStake = await prisma.readStake.findUnique({
        where: { userId_contentId: { userId, contentId } },
      });

      if (existingStake && existingStake.status === 'STAKED') {
        return reply.status(400).send({ error: 'Bad Request', message: 'You already have an active read-stake for this content.' });
      }

      // 2. Lock 5 CC in Canton ReadStake (3 transactions generated)
      const cantonResult = await CantonService.executeReadStake(userId, contentId, 5.0);

      // 3. Upsert ReadStake record in database
      const readStake = await prisma.readStake.upsert({
        where: { userId_contentId: { userId, contentId } },
        create: {
          userId,
          contentId,
          amountCC: 5.0,
          timerStartedAt: new Date(),
          status: 'STAKED',
          damlContractId: cantonResult.contractId,
        },
        update: {
          amountCC: 5.0,
          timerStartedAt: new Date(),
          status: 'STAKED',
          damlContractId: cantonResult.contractId,
        },
      });

      // 4. Start 10-minute timer in Redis (600 seconds)
      const timerKey = `read_timer:${userId}:${contentId}`;
      await redis.set(timerKey, 'active', { EX: 600 });

      return reply.send({
        success: true,
        message: 'Read stake of 5 CC locked successfully. 10-minute reading timer started.',
        readStake,
        cantonTxId: cantonResult.txId,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /content/:id/unstake - Unstake after reading
  fastify.post('/:id/unstake', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { id: contentId } = request.params as { id: string };

      // Find active read stake
      const readStake = await prisma.readStake.findUnique({
        where: { userId_contentId: { userId, contentId } },
      });

      if (!readStake || readStake.status !== 'STAKED') {
        return reply.status(404).send({ error: 'Not Found', message: 'No active read stake found for this content.' });
      }

      const timerKey = `read_timer:${userId}:${contentId}`;
      const timerActive = await redis.get(timerKey);
      
      const timeElapsedMs = readStake.timerStartedAt
        ? Date.now() - new Date(readStake.timerStartedAt).getTime()
        : 0;
      
      const tenMinutesInMs = 600 * 1000;

      // Check if timer has completed (either Redis key is gone and timeElapsed is >= 10m)
      if (!timerActive || timeElapsedMs >= tenMinutesInMs) {
        // Success: 10 minutes completed!
        // Canton txn: ReadStake archive, StakeReceipt create (3 txns)
        const cantonResult = await CantonService.executeReadUnstake(userId, contentId, readStake.damlContractId || 'mock_contract');

        await prisma.readStake.update({
          where: { id: readStake.id },
          data: {
            status: 'UNSTAKED',
            unstakedAt: new Date(),
          },
        });

        // Increment content read count
        await prisma.content.update({
          where: { id: contentId },
          data: {
            readCount: { increment: 1 },
          },
        });

        return reply.send({
          success: true,
          message: '10-minute read completed. 5 CC unstake returned to wallet.',
          status: 'UNSTAKED',
          cantonTxId: cantonResult.txId,
        });
      } else {
        // Early unstake violation: CC forfeited!
        const elapsedSec = Math.floor(timeElapsedMs / 1000);
        
        // Canton transaction: Forfeit split or stake loss
        const cantonResult = await CantonService.executeReadUnstake(userId, contentId, readStake.damlContractId || 'mock_contract');

        await prisma.readStake.update({
          where: { id: readStake.id },
          data: {
            status: 'FORFEITED',
            unstakedAt: new Date(),
          },
        });

        // Enforce anti-sybil flag: Stake-unstake before 10 min timer (+15 risk score)
        const newRisk = await RiskService.addRiskSignal(
          userId,
          `Stake-unstake before 10 min timer (read only ${elapsedSec}s)`,
          15,
          { contentId, secondsRead: elapsedSec }
        );

        return reply.send({
          success: false,
          message: `Staking timer failed: You unstaked early after only ${elapsedSec} seconds (minimum 600s required). 5 CC has been FORFEITED and a risk flag applied.`,
          status: 'FORFEITED',
          riskScore: newRisk,
          cantonTxId: cantonResult.txId,
        });
      }
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}

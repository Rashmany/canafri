import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard } from '../middleware/auth.js';
import { riskRestrictionGuard } from '../middleware/riskCheck.js';
import { CantonService } from '../services/canton.js';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  website: z.string().url().optional().or(z.literal('')),
  country: z.string().optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
  // All routes here are authenticated (except public profile)
  
  // GET /users/me - Retrieve current profile
  fastify.get('/me', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          creatorStake: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      return reply.send({ success: true, user });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /users/me - Update profile fields
  fastify.patch('/me', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const updateData = UpdateProfileSchema.parse(request.body);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return reply.send({ success: true, user: updatedUser });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /users/apply-seller - Submit seller application
  fastify.post('/apply-seller', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      if (!user.phoneVerified || !user.walletAddress) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Checklist validation failed: Phone must be verified and Canton wallet must be bound before applying.',
        });
      }

      // Deduct seller deposit on Canton (0.5 CC) - standard Canton transaction generated
      const cantonResult = await CantonService.executeSellerApplicationDeposit(userId, 0.5);

      // Set user fields to request review from admin
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isSeller: false,         // stays false until approved
          sellerApproved: false,   // pending review
        },
      });

      // Create admin notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Seller Application Submitted',
          body: `Seller application for ${user.displayName} is queued in the admin review board.`,
          type: 'SELLER_APPLICATION',
          link: `/admin/seller-apps`,
        },
      });

      return reply.send({
        success: true,
        message: 'Seller application submitted successfully and queued for admin review. 0.5 CC deposit logged.',
        cantonTxId: cantonResult.txId,
        user: updatedUser,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /users/toggle-seller-mode - Toggles Seller Mode
  fastify.post('/toggle-seller-mode', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      if (!user.sellerApproved) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Your seller profile is not approved yet.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          sellerModeOn: !user.sellerModeOn,
        },
      });

      // Update cached session mode
      const sessionKey = `session:${request.user.sessionId}`;
      const sessionCached = await redis.get(sessionKey);
      if (sessionCached) {
        const parsed = JSON.parse(sessionCached);
        parsed.isSeller = updatedUser.isSeller;
        await redis.set(sessionKey, JSON.stringify(parsed), { EX: 30 * 24 * 60 * 60 });
      }

      return reply.send({
        success: true,
        sellerModeOn: updatedUser.sellerModeOn,
        message: `Switched dashboard display to ${updatedUser.sellerModeOn ? 'Seller' : 'Member'} mode.`,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /users/daily-checkin - Collect daily reward (0.05 CC)
  fastify.post('/daily-checkin', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const todayStr = new Date().toISOString().split('T')[0];
      const checkinKey = `daily_checkin:${userId}:${todayStr}`;

      const alreadyCheckedIn = await redis.get(checkinKey);
      if (alreadyCheckedIn) {
        return reply.status(400).send({ error: 'Bad Request', message: 'You have already checked in today.' });
      }

      // Check on-chain daily check-in (1 transaction)
      const cantonResult = await CantonService.executeDailyCheckin(userId, 0.05);

      // Lock check-in for the day
      await redis.set(checkinKey, '1', { EX: 86400 });

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          title: 'Daily Check-in Reward',
          body: 'You received 0.05 CC for check-in reward.',
          type: 'REWARD',
        },
      });

      return reply.send({
        success: true,
        message: 'Checked in successfully. 0.05 CC reward issued.',
        cantonTxId: cantonResult.txId,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /users/:username - Retrieve public user profile (Public route)
  fastify.get('/:username', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { username } = request.params as { username: string };
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          country: true,
          website: true,
          isCreator: true,
          isSeller: true,
          trustScore: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      return reply.send({ success: true, user });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}

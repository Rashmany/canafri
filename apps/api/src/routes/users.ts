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

const ApplySellerSchema = z.object({
  bio:              z.string().min(10, 'Bio must be at least 10 characters').optional(),
  country:          z.string().optional(),
  city:             z.string().optional(),
  phone:            z.string().optional(),
  phonePrefix:      z.string().optional(),
  headline:         z.string().optional(),
  skills:           z.array(z.string()).optional(),
  primaryCategory:  z.string().optional(),
  subCategory:      z.string().optional(),
  yearsOfExperience:z.string().optional(),
  language:         z.string().optional(),
  hourlyRate:       z.string().optional(),
  minProjectValue:  z.string().optional(),
  availability:     z.string().optional(),
  skillsBio:        z.string().optional(),
  portfolioLinks:   z.array(z.string()).optional(),
  educationSchool:  z.string().optional(),
  educationDegree:  z.string().optional(),
  educationYear:    z.string().optional(),
  agreedToTerms:    z.boolean().optional(),
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
          content: {
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
          },
          readStakes: {
            include: {
              content: {
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
              },
            },
            orderBy: { stakedAt: 'desc' },
          },
          freelanceJobs: {
            select: { id: true, status: true, amountCC: true, title: true, createdAt: true, updatedAt: true },
            orderBy: { createdAt: 'desc' },
          },
          reviewsReceived: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              reviewer: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
              job: {
                select: { id: true, title: true },
              },
            },
          },
          postedJobs: {
            select: { id: true, status: true, amountCC: true, title: true, category: true, createdAt: true, updatedAt: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      // Fetch extended seller application payload if present
      const sellerAppNotif = await prisma.notification.findFirst({
        where: { userId: user.id, type: 'SELLER_APPLICATION' },
        orderBy: { createdAt: 'desc' },
      });

      let sellerAppData: any = {};
      if (sellerAppNotif && sellerAppNotif.body) {
        try {
          sellerAppData = JSON.parse(sellerAppNotif.body);
        } catch (e) {}
      }

      return reply.send({
        success: true,
        user,
        sellerAppData,
      });
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
      const body = ApplySellerSchema.parse(request.body || {});

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      if (!user.phoneVerified) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Phone number verification is required before submitting your freelancer application. Please verify your phone number.',
          code: 'PHONE_NOT_VERIFIED',
        });
      }

      let userWallet = user.walletAddress;
      if (!userWallet) {
        userWallet = `canton_party_${user.username || userId.slice(-8)}_${Math.random().toString(36).substring(2, 7)}`;
        await prisma.user.update({
          where: { id: userId },
          data: { walletAddress: userWallet, walletBoundAt: new Date() },
        });
        // Seed initial 500 CC Canton dev balance in Redis
        const balanceKey = `canton_balance:${userId}`;
        await redis.set(balanceKey, '500.0');
      }

      // Deduct seller deposit on Canton (0.5 CC)
      const cantonResult = await CantonService.executeSellerApplicationDeposit(userId, 0.5);

      // Persist all application fields to the user record
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(body.bio       ? { bio: body.bio }           : {}),
          ...(body.country   ? { country: body.country }   : {}),
          sellerApplied: true,
          isSeller:      false,
          sellerApproved: false,
        },
      });

      // Store extended seller application data as a JSON blob in a Notification payload
      // (full schema migration can follow; for now persist via notification body for admin view)
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Seller Application Submitted',
          body: JSON.stringify({
            summary: `Seller application for ${user.displayName} is queued in the admin review board.`,
            headline:         body.headline,
            phone:            body.phone,
            phonePrefix:      body.phonePrefix,
            city:             body.city,
            country:          body.country,
            skills:           body.skills,
            primaryCategory:  body.primaryCategory,
            subCategory:      body.subCategory,
            yearsOfExperience:body.yearsOfExperience,
            language:         body.language,
            hourlyRate:       body.hourlyRate,
            minProjectValue:  body.minProjectValue,
            availability:     body.availability,
            skillsBio:        body.skillsBio,
            portfolioLinks:   body.portfolioLinks,
            educationSchool:  body.educationSchool,
            educationDegree:  body.educationDegree,
            educationYear:    body.educationYear,
          }),
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
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
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

  // GET /users/sellers - Public endpoint to retrieve all registered sellers
  fastify.get('/sellers', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const sellers = await prisma.user.findMany({
        where: {
          OR: [
            { isSeller: true },
            { sellerApplied: true },
            { sellerApproved: true },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          country: true,
          website: true,
          emailVerified: true,
          phoneVerified: true,
          isSeller: true,
          sellerApproved: true,
          trustScore: true,
          createdAt: true,
          freelanceJobs: {
            select: { id: true, status: true, amountCC: true, title: true, createdAt: true },
          },
          reviewsReceived: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              reviewer: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const apps = await prisma.notification.findMany({
        where: { type: 'SELLER_APPLICATION' },
        orderBy: { createdAt: 'desc' },
      });

      const parsedSellers = sellers.map((user) => {
        const appNotif = apps.find((a) => a.userId === user.id);
        let extraData: any = {};
        if (appNotif && appNotif.body) {
          try {
            extraData = JSON.parse(appNotif.body);
          } catch (e) {}
        }

        const completedJobsList = user.freelanceJobs.filter((j) => j.status === 'COMPLETED');
        const completedJobs = completedJobsList.length;
        const totalEarnedCC = completedJobsList.reduce((acc, j) => acc + (j.amountCC || 0), 0);

        const revs = user.reviewsReceived || [];
        const reviewsCount = revs.length;
        const totalRatingSum = revs.reduce((sum, r) => sum + (r.rating || 0), 0);
        const avgRating = reviewsCount > 0 ? parseFloat((totalRatingSum / reviewsCount).toFixed(1)) : 0;

        const verifications: string[] = [];
        if (user.emailVerified) verifications.push('Email Verified');
        if (user.phoneVerified) verifications.push('Phone Verified');
        if (user.sellerApproved) verifications.push('Identity Verified');
        if (verifications.length === 0) verifications.push('Registered Seller');

        return {
          id: user.id,
          name: user.displayName || user.username,
          username: `@${user.username}`,
          avatar: user.avatarUrl || '',
          title: extraData.headline || extraData.primaryCategory || 'Blockchain & Canton Developer',
          level: (user.sellerApproved ? 'Top Rated Seller' : 'Verified Seller') as 'Top Rated Seller' | 'Verified Seller',
          rating: avgRating,
          reviewsCount,
          minProjectBudget: extraData.minProjectValue ? `${extraData.minProjectValue} CC` : '150 CC',
          totalEarnings: `${totalEarnedCC} CC`,
          location: user.country || extraData.country || 'Global',
          responseTime: '1 hour',
          isVerified: user.sellerApproved || user.emailVerified || user.phoneVerified,
          isOnline: true,
          bio: user.bio || extraData.skillsBio || 'No bio provided yet.',
          skills: extraData.skills && extraData.skills.length > 0
            ? extraData.skills
            : ['Daml', 'Canton Network', 'Smart Contracts'],
          completedJobs,
          jobSuccess: completedJobs > 0 ? '100%' : 'N/A',
          verifications,
          languages: extraData.language
            ? [{ name: extraData.language, level: 'Native', pct: 100 }]
            : [{ name: 'English', level: 'Native', pct: 100 }],
          gigs: [],
          workHistory: user.freelanceJobs.map((j) => ({
            id: j.id,
            title: j.title,
            date: new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            amount: `${j.amountCC || 0} CC`,
            feedback: 'Project delivery.',
            status: j.status === 'COMPLETED' ? 'Completed' : 'In Progress',
          })),
          reviews: revs.map((r) => ({
            id: r.id,
            reviewerName: r.reviewer.displayName || r.reviewer.username,
            reviewerAvatar: r.reviewer.avatarUrl || '',
            rating: r.rating,
            comment: r.comment || '',
            date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          })),
        };
      });

      return reply.send({ success: true, sellers: parsedSellers });
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
          postedJobs: {
            select: { id: true, status: true, amountCC: true, title: true, category: true, createdAt: true, updatedAt: true },
            orderBy: { createdAt: 'desc' },
          },
          reviewsReceived: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              reviewer: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
              job: {
                select: { id: true, title: true },
              },
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      // Compute buyer rating aggregate
      const agg = await prisma.review.aggregate({
        where: { revieweeId: user.id },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return reply.send({
        success: true,
        user: {
          ...user,
          buyerRating: agg._avg.rating ?? 0,
          buyerReviewsCount: agg._count.rating,
          buyerReviews: user.reviewsReceived,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}

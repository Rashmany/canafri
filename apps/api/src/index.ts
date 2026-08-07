import fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import dotenv from 'dotenv';

import multipart from '@fastify/multipart';

import { connectRedis } from './lib/redis.js';
import { prisma } from './lib/prisma.js';

// Route imports
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { contentRoutes } from './routes/content.js';
import { jobRoutes } from './routes/jobs.js';
import { messageRoutes } from './routes/messages.js';
import { walletRoutes } from './routes/wallet.js';
import { adminRoutes } from './routes/admin.js';
import { publicInviteRoutes } from './routes/admin.js';
import { notificationRoutes } from './routes/notifications.js';
import { platformConfigRoutes } from './routes/platform.js';
import { supportRoutes } from './routes/support.js';

import { initSocketServer } from './services/socket.js';

// Trigger hot reload
dotenv.config();

const server = fastify({
  logger: true,
});

const startServer = async () => {
  try {
    // 1. Connect to Redis cache
    await connectRedis();

    // 2. Register security plugins
    await server.register(helmet);
    await server.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    // 3. Register global rate limiter (100 requests per minute per IP globally)
    await server.register(rateLimit, {
      max: 100,
      timeWindow: 60000,
      errorResponseBuilder: (_request, _context) => ({
        error: 'Too Many Requests',
        statusCode: 429,
        message: 'You have made too many requests. Please slow down and try again shortly.',
      }),
    });

    // 4. Register cookies, multipart & JWT auth parsing plugins
    await server.register(cookie);
    await server.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    });
    await server.register(jwt, {
      secret: process.env.JWT_SECRET || 'canafri_jwt_access_secret_key_minimum_32_characters_long_val',
      cookie: {
        cookieName: 'refresh_token',
        signed: false,
      },
    });

    // 5. Register modular routes
    await server.register(authRoutes, { prefix: '/auth' });
    await server.register(userRoutes, { prefix: '/users' });
    await server.register(contentRoutes, { prefix: '/content' });
    await server.register(jobRoutes, { prefix: '/jobs' });
    await server.register(messageRoutes, { prefix: '/messages' });
    await server.register(walletRoutes, { prefix: '/wallet' });
    await server.register(adminRoutes, { prefix: '/admin' });
    await server.register(publicInviteRoutes, { prefix: '/auth' });
    await server.register(notificationRoutes, { prefix: '/notifications' });
    await server.register(platformConfigRoutes, { prefix: '/platform' });
    await server.register(supportRoutes, { prefix: '/support' });

    // Global Health check endpoint
    server.get('/health', async () => {
      const dbStatus = await prisma.$queryRaw`SELECT 1`.then(() => 'UP').catch(() => 'DOWN');
      return {
        status: 'UP',
        database: dbStatus,
        timestamp: new Date().toISOString(),
      };
    });

    // Handle startup port listing
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

    await server.listen({ port, host });

    // Initialize Socket.IO AFTER server is listening
    initSocketServer(server);

    console.log(`CanaFri Fastify server listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

startServer();

import fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import dotenv from 'dotenv';

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

dotenv.config();

const server = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
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
      errorResponseBuilder: (request, context) => ({
        error: 'Too Many Requests',
        statusCode: 429,
        message: `Global rate limit reached. Limit is ${context.max} requests per minute.`,
      }),
    });

    // 4. Register cookies & JWT auth parsing plugins
    await server.register(cookie);
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
    console.log(`CanaFri Fastify server listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

startServer();

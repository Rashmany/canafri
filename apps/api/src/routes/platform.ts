/**
 * Public Platform Config Route
 * GET /platform/config
 *
 * Returns a sanitized, publicly safe subset of PlatformConfig.
 * Redis-first with self-healing Postgres fallback — no auth required.
 * Used by the frontend on startup to sync platform state instantly.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPlatformConfig } from '../services/platform-config.js';

export async function platformConfigRoutes(fastify: FastifyInstance) {
  // GET /platform/config — publicly accessible, Redis-first
  fastify.get('/config', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = await getPlatformConfig();
      return reply.send({ success: true, config });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard } from '../middleware/auth.js';

const SendMessageSchema = z.object({
  receiverId: z.string(),
  jobId: z.string().optional(),
  content: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional(),
  fileType: z.string().optional(),
});

export async function messageRoutes(fastify: FastifyInstance) {
  // All routes are authenticated
  fastify.addHook('preValidation', authGuard);

  // GET /messages - List conversations/conversing users
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;

      // Fetch all messages involving the user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group by the other user to represent conversations list
      const conversationsMap = new Map<string, any>();
      for (const msg of messages) {
        const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
        if (!conversationsMap.has(otherUser.id)) {
          conversationsMap.set(otherUser.id, {
            user: otherUser,
            lastMessage: msg,
          });
        }
      }

      return reply.send({ success: true, conversations: Array.from(conversationsMap.values()) });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /messages/:userId - Get conversation thread
  fastify.get('/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: myId } = request.user;
      const { userId: otherId } = request.params as { userId: string };

      // Fetch messages between these two users
      const chatMessages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: myId, receiverId: otherId },
            { senderId: otherId, receiverId: myId },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      // Mark unread incoming messages as read
      await prisma.message.updateMany({
        where: {
          senderId: otherId,
          receiverId: myId,
          read: false,
        },
        data: { read: true },
      });

      return reply.send({ success: true, messages: chatMessages });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /messages - Send a message
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: senderId } = request.user;
      const { receiverId, jobId, content, fileUrl, fileType } = SendMessageSchema.parse(request.body);

      // Enforce Message rate limit: 20 messages per minute per user
      const limitKey = `messages_count:${senderId}`;
      const msgCount = await redis.incr(limitKey);
      if (msgCount === 1) {
        await redis.expire(limitKey, 60); // 60 seconds TTL
      }
      if (msgCount > 20) {
        return reply.status(429).send({
          error: 'Too Many Requests',
          message: 'Message rate limit exceeded. You can send a maximum of 20 messages per minute.',
        });
      }

      // Check receiver exists
      const receiverExists = await prisma.user.findUnique({
        where: { id: receiverId },
      });
      if (!receiverExists) {
        return reply.status(404).send({ error: 'Not Found', message: 'Recipient user does not exist' });
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          senderId,
          receiverId,
          jobId,
          content,
          fileUrl,
          fileType,
          read: false,
        },
      });

      // Optional: Emit message to Socket.io namespace if integrated
      // (This can be broadcasted via the Fastify app instance websocket)
      
      return reply.send({ success: true, message });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}

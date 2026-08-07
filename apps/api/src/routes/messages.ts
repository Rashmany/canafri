import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard } from '../middleware/auth.js';
import { broadcastNewMessage, broadcastMessagesRead } from '../services/socket.js';

const AttachmentItemSchema = z.object({
  url: z.string().url().or(z.string().min(1)),
  name: z.string(),
  size: z.number().max(25 * 1024 * 1024, 'Each file must be less than 25 MB'),
  mimeType: z.string(),
});

const SendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Recipient user ID is required'),
  jobId: z.string().optional(),
  content: z
    .string()
    .transform((val) => val.replace(/<[^>]*>?/gm, '').trim()) // Strip HTML tags & trim
    .pipe(z.string().min(1, 'Message cannot be empty or whitespace only').max(2000, 'Message cannot exceed 2000 characters')),
  attachments: z.array(AttachmentItemSchema).max(10, 'Maximum 10 attachments per message').optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
});

const UNSAFE_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.vbs', '.msi',
  '.dll', '.scr', '.jar', '.py', '.app', '.htc', '.cpl', '.pif'
];

function isUnsafeFile(filename: string, mimeType: string): boolean {
  const lowerName = filename.toLowerCase();
  if (UNSAFE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    return true;
  }
  const lowerMime = mimeType.toLowerCase();
  if (
    lowerMime.includes('executable') ||
    lowerMime.includes('javascript') ||
    lowerMime.includes('x-sh') ||
    lowerMime.includes('x-php')
  ) {
    return true;
  }
  return false;
}

export async function messageRoutes(fastify: FastifyInstance) {
  // All routes are authenticated
  fastify.addHook('preValidation', authGuard);

  // GET /messages/unread-count - Get total unread messages count for current user
  fastify.get('/unread-count', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const count = await prisma.message.count({
        where: {
          receiverId: userId,
          read: false,
        },
      });
      return reply.send({ success: true, unreadCount: count });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /messages - List conversations/conversing users
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;

      // Fetch all messages involving the user
      const messages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
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
          const unreadCount = messages.filter(
            (m) => m.senderId === otherUser.id && m.receiverId === userId && !m.read
          ).length;

          // Fetch presence & last seen from Redis
          const presence = (await redis.get(`presence:${otherUser.id}`)) || 'offline';
          const lastSeen = (await redis.get(`last_seen:${otherUser.id}`)) || null;

          conversationsMap.set(otherUser.id, {
            user: {
              ...otherUser,
              presence,
              lastSeen,
            },
            lastMessage: msg,
            unreadCount,
          });
        }
      }

      return reply.send({ success: true, conversations: Array.from(conversationsMap.values()) });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /messages/presence/:userId - Get user presence & last seen status
  fastify.get('/presence/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      const presence = (await redis.get(`presence:${userId}`)) || 'offline';
      const lastSeen = (await redis.get(`last_seen:${userId}`)) || null;
      return reply.send({ success: true, userId, presence, lastSeen });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /messages/:userId - Get conversation thread with pagination (limit 30)
  fastify.get('/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: myId } = request.user;
      const { userId: otherId } = request.params as { userId: string };
      const { limit: limitQuery, cursor } = request.query as { limit?: string; cursor?: string };

      const limit = Math.min(parseInt(limitQuery || '30', 10), 50);

      // Verify recipient exists
      const otherUser = await prisma.user.findUnique({
        where: { id: otherId },
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      });

      if (!otherUser) {
        return reply.status(404).send({ error: 'Not Found', message: 'Target user not found' });
      }

      const presence = (await redis.get(`presence:${otherId}`)) || 'offline';
      const lastSeen = (await redis.get(`last_seen:${otherId}`)) || null;

      // Build pagination query (limit 30 latest messages)
      const whereClause: any = {
        OR: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId },
        ],
      };

      if (cursor) {
        whereClause.id = { lt: cursor };
      }

      // Query latest messages in descending order then reverse for chat timeline
      const rawMessages = await prisma.message.findMany({
        where: whereClause,
        take: limit + 1,
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const hasMore = rawMessages.length > limit;
      const slicedMessages = hasMore ? rawMessages.slice(0, limit) : rawMessages;
      const chatMessages = slicedMessages.reverse();

      const nextCursor = hasMore && slicedMessages.length > 0 ? slicedMessages[0].id : null;

      // Mark unread incoming messages as read
      const updatedCount = await prisma.message.updateMany({
        where: {
          senderId: otherId,
          receiverId: myId,
          read: false,
        },
        data: { read: true },
      });

      if (updatedCount.count > 0) {
        broadcastMessagesRead(myId, otherId);
      }

      return reply.send({
        success: true,
        targetUser: {
          ...otherUser,
          presence,
          lastSeen,
        },
        messages: chatMessages,
        nextCursor,
        hasMore,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /messages - Send a message with anti-flood, rate-limiting & duplicate check
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId: senderId } = request.user;
      const { receiverId, jobId, content, attachments, fileUrl, fileType } = SendMessageSchema.parse(request.body);

      // 1. Anti-Flood check: max 5 messages within 10 seconds
      const floodKey = `messages_flood:${senderId}`;
      const floodCount = await redis.incr(floodKey);
      if (floodCount === 1) {
        await redis.expire(floodKey, 10); // 10s TTL
      }
      if (floodCount > 5) {
        return reply.status(429).send({
          error: 'Too Many Requests',
          message: 'You are sending messages too quickly. Please wait a moment before sending again.',
        });
      }

      // 2. Server Rate Limit: max 20 messages within 60 seconds
      const limitKey = `messages_count:${senderId}`;
      const msgCount = await redis.incr(limitKey);
      if (msgCount === 1) {
        await redis.expire(limitKey, 60); // 60s TTL
      }
      if (msgCount > 20) {
        return reply.status(429).send({
          error: 'Too Many Requests',
          message: 'You have sent too many messages. Please wait a moment before continuing.',
        });
      }

      // 3. Duplicate Message Protection: reject identical message content within 30 seconds
      const contentHash = crypto.createHash('sha256').update(`${receiverId}:${content}`).digest('hex');
      const dupKey = `messages_dup:${senderId}:${contentHash}`;
      const isDuplicate = await redis.get(dupKey);
      if (isDuplicate) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Duplicate message detected. Please wait 30 seconds before sending identical content.',
        });
      }
      await redis.set(dupKey, '1', { EX: 30 }); // 30 seconds TTL

      // 4. Check recipient user exists
      const receiverExists = await prisma.user.findUnique({
        where: { id: receiverId },
      });
      if (!receiverExists) {
        return reply.status(404).send({ error: 'Not Found', message: 'Recipient user does not exist' });
      }

      // 5. Attachment Validation (Max 10 files, 25MB per file, 100MB total, MIME type security)
      let finalFileUrl = fileUrl || '';
      let finalFileType = fileType || '';

      if (attachments && attachments.length > 0) {
        let totalSize = 0;
        for (const att of attachments) {
          if (isUnsafeFile(att.name, att.mimeType)) {
            return reply.status(400).send({
              error: 'Invalid Attachment',
              message: `File "${att.name}" is an unsafe or forbidden executable file type.`,
            });
          }
          totalSize += att.size;
        }

        if (totalSize > 100 * 1024 * 1024) {
          return reply.status(400).send({
            error: 'Payload Too Large',
            message: 'Total attachment size per message cannot exceed 100 MB.',
          });
        }

        finalFileUrl = JSON.stringify(attachments);
        finalFileType = 'attachments';
      }

      // 6. Create Message in Database
      const message = await prisma.message.create({
        data: {
          senderId,
          receiverId,
          jobId,
          content,
          fileUrl: finalFileUrl,
          fileType: finalFileType,
          read: false,
        },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      });

      // 7. Instant Socket.IO Broadcast
      broadcastNewMessage(message);

      return reply.send({ success: true, message });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', message: error.errors[0]?.message || 'Validation error' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { isValidEmailSyntax } from '../lib/emailValidator.js';
import { validateAttachment, uploadSupportAttachment } from '../services/r2.js';
import {
  sendTicketConfirmationEmail,
  notifySupportTeamNewTicket,
} from '../services/email.js';
import { authGuard } from '../middleware/auth.js';

const CreateTicketSchema = z.object({
  email: z.string().trim().toLowerCase(),
  category: z.string().trim().min(1, 'Category is required'),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(150, 'Subject is too long'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(3000, 'Message is too long'),
});

function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const randomSixDigits = Math.floor(100000 + Math.random() * 900000);
  return `CF-TKT-${year}-${randomSixDigits}`;
}

export async function supportRoutes(fastify: FastifyInstance) {
  // ── 1. POST /support/tickets — Create a Support Ticket (Guest or Authenticated) ──
  fastify.post('/tickets', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let email = '';
      let category = '';
      let subject = '';
      let message = '';
      let attachmentUrl: string | null = null;

      // Handle multipart/form-data vs application/json
      if (request.isMultipart()) {
        const parts = request.parts();
        for await (const part of parts) {
          if (part.type === 'file') {
            if (part.fieldname === 'file' && part.filename) {
              const buffer = await part.toBuffer();
              const valError = validateAttachment(part.mimetype, buffer.length);
              if (valError) {
                return reply.status(400).send({
                  error: 'Bad Request',
                  message: valError.message,
                  code: valError.code,
                });
              }
              const tempNum = generateTicketNumber();
              attachmentUrl = await uploadSupportAttachment(buffer, part.mimetype, tempNum);
            }
          } else {
            const fieldVal = (part.value as string) || '';
            if (part.fieldname === 'email') email = fieldVal.trim().toLowerCase();
            if (part.fieldname === 'category') category = fieldVal.trim();
            if (part.fieldname === 'subject') subject = fieldVal.trim();
            if (part.fieldname === 'message') message = fieldVal.trim();
          }
        }
      } else {
        const parseResult = CreateTicketSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid support request payload.',
            details: parseResult.error.flatten().fieldErrors,
          });
        }
        email = parseResult.data.email;
        category = parseResult.data.category;
        subject = parseResult.data.subject;
        message = parseResult.data.message;
      }

      if (!isValidEmailSyntax(email)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Please provide a valid email address.',
        });
      }

      // Resolve optional logged-in user safely
      let userId: string | null = null;
      try {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const decoded = fastify.jwt.verify<{ userId?: string }>(token);
          if (decoded && decoded.userId) {
            const existingUser = await prisma.user.findUnique({
              where: { id: decoded.userId },
              select: { id: true },
            });
            if (existingUser) {
              userId = existingUser.id;
            }
          }
        }
      } catch {
        // Unauthenticated or expired token — proceed as guest ticket
      }

      const ticketNumber = generateTicketNumber();

      // 1. Save SupportTicket to Database
      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          userId,
          email,
          category,
          subject,
          message,
          attachmentUrl,
          status: 'OPEN',
        },
      });

      // 2. Non-blocking Fire-and-forget Email Notifications
      sendTicketConfirmationEmail(email, ticket.ticketNumber, ticket.subject).catch((err) => {
        console.error('[SupportRoutes] Background user email error:', err);
      });

      notifySupportTeamNewTicket(ticket.ticketNumber, ticket.category, ticket.subject, email).catch((err) => {
        console.error('[SupportRoutes] Background admin email alert error:', err);
      });

      return reply.status(201).send({
        success: true,
        message: 'Support ticket submitted successfully.',
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        createdAt: ticket.createdAt,
      });
    } catch (err: any) {
      request.log.error(err, '[SupportRoutes] Failed to create support ticket');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: err?.message || 'Failed to process support ticket. Please try again.',
      });
    }
  });

  // ── 2. GET /support/my-tickets — List Authenticated User's Tickets ──
  fastify.get('/my-tickets', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const tickets = await prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          ticketNumber: true,
          category: true,
          subject: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          adminRepliedAt: true,
        },
      });

      return reply.send({ success: true, tickets });
    } catch (err) {
      request.log.error(err, '[SupportRoutes] Failed to fetch user tickets');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to retrieve tickets.' });
    }
  });

  // ── 3. GET /support/tickets/:id — Get Detailed Ticket Info ──
  fastify.get('/tickets/:id', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { userId } = request.user;

      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
      });

      if (!ticket || ticket.userId !== userId) {
        return reply.status(404).send({ error: 'Not Found', message: 'Support ticket not found.' });
      }

      return reply.send({ success: true, ticket });
    } catch (err) {
      request.log.error(err, '[SupportRoutes] Failed to fetch ticket detail');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to fetch ticket.' });
    }
  });

  // ── 4. PATCH /support/tickets/:id/followup — Submit Info when WAITING_FOR_USER ──
  fastify.patch('/tickets/:id/followup', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { userId } = request.user;

      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
      });

      if (!ticket || ticket.userId !== userId) {
        return reply.status(404).send({ error: 'Not Found', message: 'Support ticket not found.' });
      }

      if (ticket.status !== 'WAITING_FOR_USER') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Follow-up is only allowed when ticket status is Waiting for User.',
        });
      }

      let additionalMessage = '';
      let newAttachmentUrl: string | null = null;

      if (request.isMultipart()) {
        const parts = request.parts();
        for await (const part of parts) {
          if (part.type === 'file') {
            if (part.fieldname === 'file' && part.filename) {
              const buffer = await part.toBuffer();
              const valError = validateAttachment(part.mimetype, buffer.length);
              if (valError) {
                return reply.status(400).send({ error: 'Bad Request', message: valError.message });
              }
              newAttachmentUrl = await uploadSupportAttachment(buffer, part.mimetype, ticket.ticketNumber);
            }
          } else {
            if (part.fieldname === 'message') additionalMessage = (part.value as string).trim();
          }
        }
      } else {
        const body = request.body as { message?: string };
        additionalMessage = body.message ? body.message.trim() : '';
      }

      const updatedMessage = additionalMessage
        ? `${ticket.message}\n\n--- User Update (${new Date().toLocaleString()}) ---\n${additionalMessage}`
        : ticket.message;

      const updatedTicket = await prisma.supportTicket.update({
        where: { id },
        data: {
          message: updatedMessage,
          attachmentUrl: newAttachmentUrl || ticket.attachmentUrl,
          status: 'OPEN',
        },
      });

      return reply.send({
        success: true,
        message: 'Support ticket updated and re-opened for review.',
        ticket: updatedTicket,
      });
    } catch (err) {
      request.log.error(err, '[SupportRoutes] Failed to update ticket followup');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to submit follow-up.' });
    }
  });
}

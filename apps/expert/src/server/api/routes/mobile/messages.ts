import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "@adh/db";

export const customerMessageRouter = createTRPCRouter({
  // Get user's conversations
  getConversations: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const conversations = await db.message.findMany({
        where: {
          OR: [
            { senderId: input.userId },
            { receiverId: input.userId },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          appointment: {
            include: {
              clinic: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group messages by conversation partner
      const conversationMap = new Map();
      conversations.forEach((message) => {
        const partnerId = message.senderId === input.userId ? message.receiverId : message.senderId;
        const partnerName = message.senderId === input.userId
          ? (message.appointment?.clinic?.name || 'Unknown')
          : `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim();

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            partnerId,
            partnerName,
            lastMessage: message.content,
            lastSeen: message.createdAt,
            unreadCount: 0,
            avatar: message.sender.avatar,
          });
        }

        // Count unread messages
        if (!message.read && message.senderId !== input.userId) {
          conversationMap.get(partnerId).unreadCount++;
        }
      });

      return Array.from(conversationMap.values());
    }),

  // Get messages for a specific conversation
  getConversation: publicProcedure
    .input(z.object({
      userId: z.string(),
      partnerId: z.string(),
      appointmentId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await db.message.findMany({
        where: {
          OR: [
            { senderId: input.userId, receiverId: input.partnerId },
            { senderId: input.partnerId, receiverId: input.userId },
          ],
          ...(input.appointmentId && { appointmentId: input.appointmentId }),
        },
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }),

  // Send a message
  send: publicProcedure
    .input(z.object({
      content: z.string(),
      senderId: z.string(),
      receiverId: z.string().optional(),
      appointmentId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.message.create({
        data: input,
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });
    }),

  // Mark messages as read
  markAsRead: publicProcedure
    .input(z.object({
      userId: z.string(),
      partnerId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await db.message.updateMany({
        where: {
          senderId: input.partnerId,
          receiverId: input.userId,
          read: false,
        },
        data: {
          read: true,
        },
      });
    }),
});
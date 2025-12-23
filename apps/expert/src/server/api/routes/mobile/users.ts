import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "@adh/db";

export const customerUserRouter = createTRPCRouter({
  // Get current user profile
  getProfile: publicProcedure
    .input(z.object({ clerkId: z.string() }))
    .query(async ({ input }) => {
      console.log('🔍 getProfile called with:', input);
      try {
        const user = await db.user.findUnique({
          where: { id: input.clerkId },
          include: {
            pets: true,
          },
        });
        console.log('👤 Found user:', user ? 'YES' : 'NO');
        return user;
      } catch (error) {
        console.error('❌ Error in getProfile:', error);
        throw error;
      }
    }),

  // Create/update user profile
  upsertProfile: publicProcedure
    .input(z.object({
      clerkId: z.string(),
      email: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      avatar: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.user.upsert({
        where: { id: input.clerkId },
        update: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          avatar: input.avatar,
        },
        create: {
          id: input.clerkId, // Use clerkId as the primary key
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          avatar: input.avatar,
          role: 'customer',
        },
      });
    }),
});
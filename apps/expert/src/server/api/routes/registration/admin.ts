import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const adminRegistration = createTRPCRouter({
  createTeam: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";

      // Ensure user exists in database
      await ctx.db.user.upsert({
        where: { id: userId },
        update: { email },
        create: { id: userId, email, role: "admin" },
      });

      // Create team
      const team = await ctx.db.team.create({
        data: {
          name: input.name,
          users: {
            connect: { id: userId },
          },
        },
      });

      // Update user's role to admin
      await ctx.db.user.update({
        where: { id: userId },
        data: { role: "admin", teamId: team.id },
      });

      return team;
    }),

  createBranch: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        location: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        include: { team: true },
      });

      if (!user || !user.team) {
        throw new Error("User or team not found");
      }

      const branch = await ctx.db.branch.create({
        data: {
          name: input.name,
          location: input.location,
          teamId: user.team.id,
        },
      });

      return branch;
    }),

  getBranches: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      include: { team: { include: { branches: true } } },
    });

    if (!user?.team) throw new Error("Team not found");

    return user.team.branches;
  }),
});

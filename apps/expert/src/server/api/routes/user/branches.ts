import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const branchesRouter = createTRPCRouter({
  getAllBranches: protectedProcedure.query(async ({ ctx }) => {
    // Get user's team ID
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { teamId: true, role: true },
    });

    if (!user?.teamId) {
      return [];
    }

    // Filter branches by team ID
    return ctx.db.branch.findMany({
      where: { teamId: user.teamId },
    });
  }),

  createBranch: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        location: z.string().min(1),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get user's team ID
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (!user?.teamId) {
        throw new Error("User does not belong to a team");
      }

      return ctx.db.branch.create({
        data: {
          ...input,
          teamId: user.teamId,
        },
      });
    }),

  updateBranch: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        location: z.string().min(1),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get user's team ID
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (!user?.teamId) {
        throw new Error("User does not belong to a team");
      }

      const { id, ...data } = input;
      return ctx.db.branch.update({
        where: {
          id,
          teamId: user.teamId, // Ensure user can only update branches from their team
        },
        data,
      });
    }),

  deleteBranch: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get user's team ID
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { teamId: true },
      });

      if (!user?.teamId) {
        throw new Error("User does not belong to a team");
      }

      return ctx.db.branch.delete({
        where: { 
          id: input.id,
          teamId: user.teamId, // Ensure user can only delete branches from their team
        },
      });
    }),
});

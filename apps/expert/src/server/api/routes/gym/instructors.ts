import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const instructorsRouter = createTRPCRouter({
  // Get all instructors for the user's team
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    const currentUser = await ctx.db.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    if (!currentUser?.teamId) {
      return [];
    }

    return ctx.db.instructor.findMany({
      where: {
        branch: {
          teamId: currentUser.teamId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }),

  // Get single instructor by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const instructor = await ctx.db.instructor.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          branch: true,
          sessions: {
            take: 10,
            orderBy: { startTime: "desc" },
            include: {
              classType: true,
            },
          },
        },
      });

      if (!instructor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Instructor not found" });
      }

      return instructor;
    }),

  // Create new instructor
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        userId: z.string().optional(),
        branchId: z.string().min(1, "Branch is required"),
        specialty: z.string().optional(),
        bio: z.string().optional(),
        avatar: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User does not belong to a team",
        });
      }

      // Verify branch belongs to user's team
      const branch = await ctx.db.branch.findFirst({
        where: {
          id: input.branchId,
          teamId: currentUser.teamId,
        },
      });

      if (!branch) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Branch not found or does not belong to your team",
        });
      }

      return ctx.db.instructor.create({
        data: input,
        include: {
          user: true,
          branch: true,
        },
      });
    }),

  // Update instructor
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        userId: z.string().optional(),
        branchId: z.string().optional(),
        specialty: z.string().optional(),
        bio: z.string().optional(),
        avatar: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const instructor = await ctx.db.instructor.findUnique({
        where: { id },
      });

      if (!instructor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Instructor not found" });
      }

      return ctx.db.instructor.update({
        where: { id },
        data,
        include: {
          user: true,
          branch: true,
        },
      });
    }),

  // Delete instructor
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instructor = await ctx.db.instructor.findUnique({
        where: { id: input.id },
        include: {
          sessions: {
            where: {
              startTime: { gte: new Date() },
              isCancelled: false,
            },
            take: 1,
          },
        },
      });

      if (!instructor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Instructor not found" });
      }

      if (instructor.sessions.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete instructor with upcoming sessions",
        });
      }

      return ctx.db.instructor.delete({
        where: { id: input.id },
      });
    }),
});

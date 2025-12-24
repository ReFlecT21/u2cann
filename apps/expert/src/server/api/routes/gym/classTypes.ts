import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const classTypesRouter = createTRPCRouter({
  // Get all class types for the user's team
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    const currentUser = await ctx.db.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    if (!currentUser?.teamId) {
      return [];
    }

    return ctx.db.gymClassType.findMany({
      where: { teamId: currentUser.teamId },
      orderBy: { displayName: "asc" },
    });
  }),

  // Get single class type by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const classType = await ctx.db.gymClassType.findUnique({
        where: { id: input.id },
        include: {
          sessions: {
            take: 10,
            orderBy: { startTime: "desc" },
          },
          templates: true,
        },
      });

      if (!classType) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class type not found" });
      }

      return classType;
    }),

  // Create new class type
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        displayName: z.string().min(1, "Display name is required"),
        description: z.string().optional(),
        duration: z.number().min(1, "Duration must be at least 1 minute"),
        defaultCapacity: z.number().min(1).default(12),
        isOpenGym: z.boolean().default(false),
        color: z.string().optional(),
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

      return ctx.db.gymClassType.create({
        data: {
          ...input,
          teamId: currentUser.teamId,
        },
      });
    }),

  // Update class type
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        displayName: z.string().min(1).optional(),
        description: z.string().optional(),
        duration: z.number().min(1).optional(),
        defaultCapacity: z.number().min(1).optional(),
        isOpenGym: z.boolean().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const classType = await ctx.db.gymClassType.findUnique({
        where: { id },
      });

      if (!classType) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class type not found" });
      }

      return ctx.db.gymClassType.update({
        where: { id },
        data,
      });
    }),

  // Delete class type
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const classType = await ctx.db.gymClassType.findUnique({
        where: { id: input.id },
        include: {
          sessions: { take: 1 },
        },
      });

      if (!classType) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class type not found" });
      }

      if (classType.sessions.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete class type with existing sessions",
        });
      }

      return ctx.db.gymClassType.delete({
        where: { id: input.id },
      });
    }),
});

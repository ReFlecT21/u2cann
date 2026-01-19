import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const classTypesRouter = createTRPCRouter({
  // Get all class types
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.gymClassType.findMany({
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
      return ctx.db.gymClassType.create({
        data: input,
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

  // Get session count for a class type (for delete confirmation)
  getSessionCount: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const count = await ctx.db.classSession.count({
        where: { classTypeId: input.id },
      });
      return { count };
    }),

  // Delete class type (cascades to sessions and templates)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const classType = await ctx.db.gymClassType.findUnique({
        where: { id: input.id },
      });

      if (!classType) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class type not found" });
      }

      // Delete will cascade to sessions and templates due to onDelete: Cascade in schema
      return ctx.db.gymClassType.delete({
        where: { id: input.id },
      });
    }),
});

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const closureTypeEnum = z.enum([
  "holiday",
  "maintenance",
  "emergency",
  "training",
  "event",
  "closure",
  "other",
]);

export const closuresRouter = createTRPCRouter({
  // Get all gym closures
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const closures = await ctx.db.gymClosure.findMany({
      orderBy: { date: "asc" },
    });
    return closures;
  }),

  // Get upcoming closures (from today onwards)
  getUpcoming: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const closures = await ctx.db.gymClosure.findMany({
      where: {
        date: { gte: today },
      },
      orderBy: { date: "asc" },
    });
    return closures;
  }),

  // Create a new gym closure
  create: protectedProcedure
    .input(
      z.object({
        date: z.string(), // ISO date string "YYYY-MM-DD"
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        reason: z.string().optional(),
        type: closureTypeEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const closure = await ctx.db.gymClosure.create({
        data: {
          date: new Date(input.date),
          startTime: input.startTime,
          endTime: input.endTime,
          reason: input.reason,
          type: input.type,
        },
      });
      return closure;
    }),

  // Update an existing gym closure
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.string().optional(),
        startTime: z.string().optional().nullable(),
        endTime: z.string().optional().nullable(),
        reason: z.string().optional().nullable(),
        type: closureTypeEnum.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const updateData: any = {};
      if (data.date) updateData.date = new Date(data.date);
      if (data.startTime !== undefined) updateData.startTime = data.startTime;
      if (data.endTime !== undefined) updateData.endTime = data.endTime;
      if (data.reason !== undefined) updateData.reason = data.reason;
      if (data.type) updateData.type = data.type;

      const closure = await ctx.db.gymClosure.update({
        where: { id },
        data: updateData,
      });
      return closure;
    }),

  // Delete a gym closure
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.gymClosure.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),

  // Check if a specific date/time is blocked
  isBlocked: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        time: z.string().optional(), // "HH:mm" format
      })
    )
    .query(async ({ ctx, input }) => {
      const dateOnly = new Date(input.date);
      dateOnly.setHours(0, 0, 0, 0);

      const closures = await ctx.db.gymClosure.findMany({
        where: {
          date: dateOnly,
        },
      });

      for (const closure of closures) {
        // All day closure
        if (!closure.startTime || !closure.endTime) {
          return { blocked: true, reason: closure.reason, type: closure.type };
        }

        // Time-specific closure - check if provided time falls within
        if (input.time) {
          if (input.time >= closure.startTime && input.time <= closure.endTime) {
            return { blocked: true, reason: closure.reason, type: closure.type };
          }
        }
      }

      return { blocked: false };
    }),
});

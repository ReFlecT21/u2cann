import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const templatesRouter = createTRPCRouter({
  // Get all templates
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.classTemplate.findMany({
      include: {
        classType: true,
        instructor: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }),

  // Get templates grouped by day of week
  getGroupedByDay: protectedProcedure.query(async ({ ctx }) => {
    const templates = await ctx.db.classTemplate.findMany({
      where: { isActive: true },
      include: {
        classType: true,
        instructor: true,
      },
      orderBy: { startTime: "asc" },
    });

    // Group by day of week
    const grouped: Record<number, typeof templates> = {};
    for (const template of templates) {
      const day = template.dayOfWeek;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day]!.push(template);
    }

    return grouped;
  }),

  // Get single template by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.classTemplate.findUnique({
        where: { id: input.id },
        include: {
          classType: true,
          instructor: true,
          sessions: {
            take: 10,
            orderBy: { startTime: "desc" },
          },
        },
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return template;
    }),

  // Create new template
  create: protectedProcedure
    .input(
      z.object({
        classTypeId: z.string().min(1, "Class type is required"),
        instructorId: z.string().min(1, "Instructor is required"),
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
        capacity: z.number().min(1),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for conflicting templates (same instructor, day, overlapping time)
      const existingTemplates = await ctx.db.classTemplate.findMany({
        where: {
          instructorId: input.instructorId,
          dayOfWeek: input.dayOfWeek,
          isActive: true,
        },
      });

      for (const existing of existingTemplates) {
        // Simple time overlap check
        if (
          (input.startTime >= existing.startTime && input.startTime < existing.endTime) ||
          (input.endTime > existing.startTime && input.endTime <= existing.endTime) ||
          (input.startTime <= existing.startTime && input.endTime >= existing.endTime)
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Instructor already has a template at this time",
          });
        }
      }

      return ctx.db.classTemplate.create({
        data: input,
        include: {
          classType: true,
          instructor: true,
        },
      });
    }),

  // Update template
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        classTypeId: z.string().optional(),
        instructorId: z.string().optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        capacity: z.number().min(1).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const template = await ctx.db.classTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return ctx.db.classTemplate.update({
        where: { id },
        data,
        include: {
          classType: true,
          instructor: true,
        },
      });
    }),

  // Delete template
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.db.classTemplate.findUnique({
        where: { id: input.id },
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return ctx.db.classTemplate.delete({
        where: { id: input.id },
      });
    }),

  // Toggle template active status
  toggleActive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.db.classTemplate.findUnique({
        where: { id: input.id },
      });

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return ctx.db.classTemplate.update({
        where: { id: input.id },
        data: { isActive: !template.isActive },
        include: {
          classType: true,
          instructor: true,
        },
      });
    }),
});

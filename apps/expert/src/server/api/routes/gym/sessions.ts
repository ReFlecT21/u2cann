import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const sessionsRouter = createTRPCRouter({
  // Get all sessions for the user's team
  getAll: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        branchId: z.string().optional(),
        classTypeId: z.string().optional(),
        instructorId: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });

      if (!currentUser?.teamId) {
        return [];
      }

      const whereClause: any = {
        branch: {
          teamId: currentUser.teamId,
        },
      };

      if (input?.startDate) {
        whereClause.startTime = { gte: input.startDate };
      }

      if (input?.endDate) {
        whereClause.startTime = {
          ...whereClause.startTime,
          lte: input.endDate,
        };
      }

      if (input?.branchId) {
        whereClause.branchId = input.branchId;
      }

      if (input?.classTypeId) {
        whereClause.classTypeId = input.classTypeId;
      }

      if (input?.instructorId) {
        whereClause.instructorId = input.instructorId;
      }

      return ctx.db.classSession.findMany({
        where: whereClause,
        include: {
          classType: true,
          instructor: true,
          branch: true,
          bookings: {
            where: { status: "confirmed" },
            select: { id: true },
          },
        },
        orderBy: { startTime: "asc" },
      });
    }),

  // Get single session by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.classSession.findUnique({
        where: { id: input.id },
        include: {
          classType: true,
          instructor: true,
          branch: true,
          bookings: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      return session;
    }),

  // Create new session
  create: protectedProcedure
    .input(
      z.object({
        classTypeId: z.string().min(1, "Class type is required"),
        instructorId: z.string().min(1, "Instructor is required"),
        branchId: z.string().min(1, "Branch is required"),
        startTime: z.date(),
        endTime: z.date(),
        capacity: z.number().min(1),
        notes: z.string().optional(),
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

      // Check for conflicting sessions (same instructor at same time)
      const conflict = await ctx.db.classSession.findFirst({
        where: {
          instructorId: input.instructorId,
          isCancelled: false,
          OR: [
            {
              AND: [
                { startTime: { lte: input.startTime } },
                { endTime: { gt: input.startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: input.endTime } },
                { endTime: { gte: input.endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: input.startTime } },
                { endTime: { lte: input.endTime } },
              ],
            },
          ],
        },
      });

      if (conflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Instructor already has a session at this time",
        });
      }

      return ctx.db.classSession.create({
        data: {
          ...input,
          bookedCount: 0,
        },
        include: {
          classType: true,
          instructor: true,
          branch: true,
        },
      });
    }),

  // Update session
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        classTypeId: z.string().optional(),
        instructorId: z.string().optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        capacity: z.number().min(1).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const session = await ctx.db.classSession.findUnique({
        where: { id },
      });

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      // If capacity is being reduced, check it's not below current bookings
      if (data.capacity && data.capacity < session.bookedCount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reduce capacity below current bookings (${session.bookedCount})`,
        });
      }

      return ctx.db.classSession.update({
        where: { id },
        data,
        include: {
          classType: true,
          instructor: true,
          branch: true,
        },
      });
    }),

  // Cancel session (soft delete)
  cancel: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.classSession.findUnique({
        where: { id: input.id },
      });

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      return ctx.db.classSession.update({
        where: { id: input.id },
        data: {
          isCancelled: true,
          cancelReason: input.reason,
        },
      });
    }),

  // Delete session (hard delete - only if no bookings)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.classSession.findUnique({
        where: { id: input.id },
      });

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      if (session.bookedCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete session with existing bookings. Cancel it instead.",
        });
      }

      return ctx.db.classSession.delete({
        where: { id: input.id },
      });
    }),

  // Generate sessions from templates for a date range
  generateFromTemplates: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        branchId: z.string().optional(),
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

      // Get active templates
      const whereClause: any = {
        isActive: true,
        classType: {
          teamId: currentUser.teamId,
        },
      };

      if (input.branchId) {
        whereClause.branchId = input.branchId;
      }

      const templates = await ctx.db.classTemplate.findMany({
        where: whereClause,
        include: {
          classType: true,
          instructor: true,
        },
      });

      const sessionsToCreate: any[] = [];

      // Iterate through each day in the date range
      const currentDate = new Date(input.startDate);
      while (currentDate <= input.endDate) {
        const dayOfWeek = currentDate.getDay();

        // Find templates for this day
        const dayTemplates = templates.filter((t) => t.dayOfWeek === dayOfWeek);

        for (const template of dayTemplates) {
          // Parse start and end times
          const startParts = template.startTime.split(":");
          const endParts = template.endTime.split(":");
          const startHour = Number(startParts[0]) || 0;
          const startMin = Number(startParts[1]) || 0;
          const endHour = Number(endParts[0]) || 0;
          const endMin = Number(endParts[1]) || 0;

          const startTime = new Date(currentDate);
          startTime.setHours(startHour, startMin, 0, 0);

          const endTime = new Date(currentDate);
          endTime.setHours(endHour, endMin, 0, 0);

          // Check if session already exists
          const existing = await ctx.db.classSession.findFirst({
            where: {
              templateId: template.id,
              startTime,
            },
          });

          if (!existing) {
            sessionsToCreate.push({
              classTypeId: template.classTypeId,
              instructorId: template.instructorId,
              branchId: template.branchId,
              startTime,
              endTime,
              capacity: template.capacity,
              templateId: template.id,
              bookedCount: 0,
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Batch create sessions
      if (sessionsToCreate.length > 0) {
        await ctx.db.classSession.createMany({
          data: sessionsToCreate,
        });
      }

      return {
        created: sessionsToCreate.length,
        message: `Created ${sessionsToCreate.length} sessions from templates`,
      };
    }),
});

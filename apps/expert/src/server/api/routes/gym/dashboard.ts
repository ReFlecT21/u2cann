import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addDays } from "date-fns";

export const dashboardRouter = createTRPCRouter({
  // Get today's sessions with full booking details
  getTodaySessions: protectedProcedure
    .input(
      z.object({
        date: z.date().optional(), // defaults to today
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const targetDate = input?.date ?? new Date();

      // Get current user's role and instructor info
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          instructor: { select: { id: true } },
        },
      });

      const whereClause: any = {
        startTime: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
        isCancelled: false,
      };

      // If coach, only show their sessions
      if (currentUser?.role === "coach" && currentUser.instructor) {
        whereClause.instructorId = currentUser.instructor.id;
      }

      const sessions = await ctx.db.classSession.findMany({
        where: whereClause,
        include: {
          classType: true,
          instructor: true,
          bookings: {
            where: { status: "confirmed" },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
              sessionUsage: {
                select: {
                  id: true,
                  membershipId: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { startTime: "asc" },
      });

      return sessions;
    }),

  // Get weekly overview (sessions per day with counts)
  getWeeklyOverview: protectedProcedure
    .input(
      z.object({
        weekStart: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const weekStart = input?.weekStart ?? startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      // Get current user's role and instructor info
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          instructor: { select: { id: true } },
        },
      });

      const whereClause: any = {
        startTime: {
          gte: weekStart,
          lte: weekEnd,
        },
        isCancelled: false,
      };

      // If coach, only show their sessions
      if (currentUser?.role === "coach" && currentUser.instructor) {
        whereClause.instructorId = currentUser.instructor.id;
      }

      const sessions = await ctx.db.classSession.findMany({
        where: whereClause,
        include: {
          classType: true,
          instructor: true,
          _count: {
            select: { bookings: { where: { status: "confirmed" } } },
          },
        },
        orderBy: { startTime: "asc" },
      });

      // Group by day
      const byDay: Record<string, typeof sessions> = {};
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dayKey = day.toISOString().split("T")[0]!;
        byDay[dayKey] = [];
      }

      for (const session of sessions) {
        const dayKey = session.startTime.toISOString().split("T")[0]!;
        if (byDay[dayKey]) {
          byDay[dayKey]!.push(session);
        }
      }

      return {
        weekStart,
        weekEnd,
        days: byDay,
      };
    }),

  // Get dashboard stats
  getStats: protectedProcedure
    .input(
      z.object({
        date: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const targetDate = input?.date ?? new Date();

      // Get current user's role and instructor info
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          instructor: { select: { id: true } },
        },
      });

      const sessionWhereClause: any = {
        startTime: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
        isCancelled: false,
      };

      // If coach, only show their stats
      if (currentUser?.role === "coach" && currentUser.instructor) {
        sessionWhereClause.instructorId = currentUser.instructor.id;
      }

      // Get today's sessions
      const todaySessions = await ctx.db.classSession.findMany({
        where: sessionWhereClause,
        select: {
          id: true,
          capacity: true,
          bookedCount: true,
        },
      });

      const totalSessions = todaySessions.length;
      const totalBookings = todaySessions.reduce((sum, s) => sum + s.bookedCount, 0);
      const totalCapacity = todaySessions.reduce((sum, s) => sum + s.capacity, 0);
      const availableSpots = totalCapacity - totalBookings;
      const fullSessions = todaySessions.filter((s) => s.bookedCount >= s.capacity).length;

      // Get this week's total bookings
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

      const weekSessionsWhere: any = {
        startTime: { gte: weekStart, lte: weekEnd },
        isCancelled: false,
      };
      if (currentUser?.role === "coach" && currentUser.instructor) {
        weekSessionsWhere.instructorId = currentUser.instructor.id;
      }

      const weekSessions = await ctx.db.classSession.findMany({
        where: weekSessionsWhere,
        select: { bookedCount: true },
      });

      const weeklyBookings = weekSessions.reduce((sum, s) => sum + s.bookedCount, 0);

      return {
        totalSessions,
        totalBookings,
        totalCapacity,
        availableSpots,
        fullSessions,
        weeklyBookings,
        occupancyRate: totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0,
      };
    }),

  // Mark attendance for a booking
  markAttendance: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        attended: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { bookingId, attended } = input;

      // Get the booking with session usage info
      const booking = await ctx.db.classBooking.findUnique({
        where: { id: bookingId },
        include: {
          sessionUsage: {
            include: {
              membership: {
                include: {
                  plan: true,
                },
              },
            },
          },
        },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // If marking as absent and there's a flexi session usage, refund it
      if (!attended && booking.sessionUsage) {
        const membership = booking.sessionUsage.membership;

        // Only refund for flexi packages
        if (membership.plan.category === "FLEXI_PACKAGE") {
          await ctx.db.$transaction([
            // Refund the session
            ctx.db.userMembership.update({
              where: { id: membership.id },
              data: {
                sessionsRemaining: { increment: 1 },
                sessionsUsed: { decrement: 1 },
              },
            }),
            // Delete the session usage record
            ctx.db.sessionUsage.delete({
              where: { id: booking.sessionUsage!.id },
            }),
            // Update booking attendance
            ctx.db.classBooking.update({
              where: { id: bookingId },
              data: { attended: false },
            }),
          ]);

          return { success: true, sessionRefunded: true };
        }
      }

      // If marking as attended and user has flexi membership without session usage, deduct
      if (attended && !booking.sessionUsage && booking.userId) {
        // Find active flexi membership for this user
        const flexiMembership = await ctx.db.userMembership.findFirst({
          where: {
            userId: booking.userId,
            status: "ACTIVE",
            plan: { category: "FLEXI_PACKAGE" },
            sessionsRemaining: { gt: 0 },
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          include: { plan: true },
        });

        if (flexiMembership) {
          await ctx.db.$transaction([
            // Deduct the session
            ctx.db.userMembership.update({
              where: { id: flexiMembership.id },
              data: {
                sessionsRemaining: { decrement: 1 },
                sessionsUsed: { increment: 1 },
              },
            }),
            // Create session usage record
            ctx.db.sessionUsage.create({
              data: {
                membershipId: flexiMembership.id,
                bookingId: bookingId,
              },
            }),
            // Update booking attendance
            ctx.db.classBooking.update({
              where: { id: bookingId },
              data: { attended: true },
            }),
          ]);

          return { success: true, sessionDeducted: true };
        }
      }

      // Simple attendance update (no flexi logic needed)
      await ctx.db.classBooking.update({
        where: { id: bookingId },
        data: { attended },
      });

      return { success: true };
    }),
});

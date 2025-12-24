import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const publicScheduleRouter = createTRPCRouter({
  // Get weekly schedule for public display
  getWeeklySchedule: publicProcedure
    .input(
      z.object({
        branchId: z.string().optional(),
        teamId: z.string().optional(),
        weekStartDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const weekEnd = new Date(input.weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const whereClause: any = {
        startTime: {
          gte: input.weekStartDate,
          lt: weekEnd,
        },
        isCancelled: false,
      };

      if (input.branchId) {
        whereClause.branchId = input.branchId;
      }

      if (input.teamId) {
        whereClause.branch = {
          teamId: input.teamId,
        };
      }

      const sessions = await ctx.db.classSession.findMany({
        where: whereClause,
        include: {
          classType: true,
          instructor: true,
          branch: true,
        },
        orderBy: { startTime: "asc" },
      });

      // Group sessions by day of week
      const groupedByDay: Record<number, typeof sessions> = {};
      for (const session of sessions) {
        const dayOfWeek = session.startTime.getDay();
        if (!groupedByDay[dayOfWeek]) {
          groupedByDay[dayOfWeek] = [];
        }
        groupedByDay[dayOfWeek].push(session);
      }

      return {
        sessions,
        groupedByDay,
        weekStart: input.weekStartDate,
        weekEnd,
      };
    }),

  // Get session details
  getSessionDetails: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.classSession.findUnique({
        where: { id: input.sessionId },
        include: {
          classType: true,
          instructor: true,
          branch: true,
          bookings: {
            where: { status: "confirmed" },
            select: { id: true },
          },
        },
      });

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      return {
        ...session,
        availableSpots: session.capacity - session.bookedCount,
      };
    }),

  // Create booking with race condition handling
  createBooking: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        guestName: z.string().min(1, "Name is required"),
        guestEmail: z.string().email("Valid email is required"),
        guestPhone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(
        async (tx) => {
          // 1. Lock the session row for update (prevents concurrent reads getting stale data)
          const sessions = await tx.$queryRaw<
            Array<{
              id: string;
              bookedCount: number;
              capacity: number;
              isCancelled: boolean;
            }>
          >`
            SELECT id, "bookedCount", capacity, "isCancelled"
            FROM class_sessions
            WHERE id = ${input.sessionId}
            FOR UPDATE
          `;

          const session = sessions[0];

          if (!session) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Session not found",
            });
          }

          // 2. Check if session is full
          if (session.bookedCount >= session.capacity) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This class is now full. Please try another time.",
            });
          }

          // 3. Check if session is cancelled
          if (session.isCancelled) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This class has been cancelled.",
            });
          }

          // 4. Check for duplicate booking (same email for same session)
          const existingBooking = await tx.classBooking.findFirst({
            where: {
              sessionId: input.sessionId,
              guestEmail: input.guestEmail,
              status: "confirmed",
            },
          });

          if (existingBooking) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "You already have a booking for this class.",
            });
          }

          // 5. Create booking
          const booking = await tx.classBooking.create({
            data: {
              sessionId: input.sessionId,
              guestName: input.guestName,
              guestEmail: input.guestEmail,
              guestPhone: input.guestPhone,
              status: "confirmed",
            },
          });

          // 6. Increment booked count
          await tx.classSession.update({
            where: { id: input.sessionId },
            data: { bookedCount: { increment: 1 } },
          });

          return {
            success: true,
            confirmationCode: booking.confirmationCode,
            booking,
          };
        },
        {
          isolationLevel: "Serializable",
          timeout: 10000,
        }
      );
    }),

  // Lookup booking by confirmation code
  getBookingByCode: publicProcedure
    .input(z.object({ confirmationCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.db.classBooking.findUnique({
        where: { confirmationCode: input.confirmationCode },
        include: {
          session: {
            include: {
              classType: true,
              instructor: true,
              branch: true,
            },
          },
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      return booking;
    }),

  // Cancel booking
  cancelBooking: publicProcedure
    .input(
      z.object({
        confirmationCode: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        const booking = await tx.classBooking.findUnique({
          where: { confirmationCode: input.confirmationCode },
        });

        if (!booking) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Booking not found",
          });
        }

        if (booking.guestEmail.toLowerCase() !== input.email.toLowerCase()) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Email does not match the booking",
          });
        }

        if (booking.status !== "confirmed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Booking is already cancelled or completed",
          });
        }

        // Update booking status
        await tx.classBooking.update({
          where: { id: booking.id },
          data: { status: "cancelled" },
        });

        // Decrement booked count
        await tx.classSession.update({
          where: { id: booking.sessionId },
          data: { bookedCount: { decrement: 1 } },
        });

        return { success: true, message: "Booking cancelled successfully" };
      });
    }),

  // Get available branches/locations
  getBranches: publicProcedure
    .input(z.object({ teamId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const whereClause: any = {};
      if (input.teamId) {
        whereClause.teamId = input.teamId;
      }

      return ctx.db.branch.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          location: true,
        },
      });
    }),

  // Get class types for filtering
  getClassTypes: publicProcedure
    .input(z.object({ teamId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const whereClause: any = {};
      if (input.teamId) {
        whereClause.teamId = input.teamId;
      }

      return ctx.db.gymClassType.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          duration: true,
          isOpenGym: true,
          color: true,
        },
      });
    }),
});

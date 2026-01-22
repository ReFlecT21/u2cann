import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import {
  validateMembershipForBooking,
  deductSession,
  refundSession,
  getUserMembershipSummary,
} from "~/server/services/membershipService";

export const publicScheduleRouter = createTRPCRouter({
  // Get weekly schedule for public display
  getWeeklySchedule: publicProcedure
    .input(
      z.object({
        weekStartDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const weekEnd = new Date(input.weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Fetch gym closures for this week
      const closures = await ctx.db.gymClosure.findMany({
        where: {
          date: {
            gte: input.weekStartDate,
            lt: weekEnd,
          },
        },
      });

      // Create a map of closed dates/times for quick lookup
      const closureMap = new Map<string, { allDay: boolean; startTime?: string; endTime?: string }[]>();
      for (const closure of closures) {
        const dateKey = closure.date.toISOString().split("T")[0]!;
        if (!closureMap.has(dateKey)) {
          closureMap.set(dateKey, []);
        }
        closureMap.get(dateKey)!.push({
          allDay: !closure.startTime || !closure.endTime,
          startTime: closure.startTime || undefined,
          endTime: closure.endTime || undefined,
        });
      }

      // Filter out past sessions - only show sessions that haven't started yet
      const now = new Date();

      const sessions = await ctx.db.classSession.findMany({
        where: {
          startTime: {
            gte: now > input.weekStartDate ? now : input.weekStartDate, // Don't show past classes
            lt: weekEnd,
          },
          isCancelled: false,
        },
        include: {
          classType: true,
          instructor: true,
        },
        orderBy: { startTime: "asc" },
      });

      // Filter out sessions on closed days/times
      const filteredSessions = sessions.filter((session) => {
        const dateKey = session.startTime.toISOString().split("T")[0]!;
        const closuresForDay = closureMap.get(dateKey);

        if (!closuresForDay) return true; // No closures for this day

        // Check each closure for this day
        for (const closure of closuresForDay) {
          if (closure.allDay) {
            return false; // All day closure - filter out this session
          }

          // Time-specific closure - check if session overlaps
          if (closure.startTime && closure.endTime) {
            const sessionStartTime = session.startTime.toTimeString().slice(0, 5); // "HH:mm"
            const sessionEndTime = session.endTime.toTimeString().slice(0, 5);

            // Check if session overlaps with closure time
            if (sessionStartTime < closure.endTime && sessionEndTime > closure.startTime) {
              return false; // Session overlaps with closure
            }
          }
        }

        return true; // Session is not blocked
      });

      // Group sessions by day of week
      const groupedByDay: Record<number, typeof filteredSessions> = {};
      for (const session of filteredSessions) {
        const dayOfWeek = session.startTime.getDay();
        if (!groupedByDay[dayOfWeek]) {
          groupedByDay[dayOfWeek] = [];
        }
        groupedByDay[dayOfWeek].push(session);
      }

      return {
        sessions: filteredSessions,
        groupedByDay,
        weekStart: input.weekStartDate,
        weekEnd,
        closedDates: Array.from(closureMap.keys()),
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

          // 3.5 Check 4-hour advance booking rule (only if no one has booked yet)
          if (session.bookedCount === 0) {
            const sessionDetails = await tx.classSession.findUnique({
              where: { id: input.sessionId },
              select: { startTime: true },
            });

            if (sessionDetails) {
              const now = new Date();
              const classTime = new Date(sessionDetails.startTime);
              const hoursUntilClass = (classTime.getTime() - now.getTime()) / (1000 * 60 * 60);

              if (hoursUntilClass < 4) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Bookings must be made at least 4 hours in advance when no one else has booked. Please check back later or choose another class.",
                });
              }
            }
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

  // Get class types for filtering
  getClassTypes: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.gymClassType.findMany({
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

  // ===== AUTHENTICATED PROCEDURES (for members) =====

  // Check membership status for authenticated user
  checkMembership: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    return validateMembershipForBooking(userId);
  }),

  // Get membership summary for authenticated user
  getMembershipSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    return getUserMembershipSummary(userId);
  }),

  // Create booking with membership validation (for authenticated users)
  createAuthenticatedBooking: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Get user info from database
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, phone: true },
      });

      if (!user?.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email not found. Please update your profile.",
        });
      }

      // Validate membership
      const membershipCheck = await validateMembershipForBooking(userId);

      if (!membershipCheck.isValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            membershipCheck.reason ||
            "No active membership. Please purchase a membership to book classes.",
        });
      }

      // Create booking within transaction
      const result = await ctx.db.$transaction(
        async (tx) => {
          // Lock session for update
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

          if (session.bookedCount >= session.capacity) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This class is now full. Please try another time.",
            });
          }

          if (session.isCancelled) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This class has been cancelled.",
            });
          }

          // Check 4-hour advance booking rule (only if no one has booked yet)
          if (session.bookedCount === 0) {
            const sessionDetails = await tx.classSession.findUnique({
              where: { id: input.sessionId },
              select: { startTime: true },
            });

            if (sessionDetails) {
              const now = new Date();
              const classTime = new Date(sessionDetails.startTime);
              const hoursUntilClass = (classTime.getTime() - now.getTime()) / (1000 * 60 * 60);

              if (hoursUntilClass < 4) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Bookings must be made at least 4 hours in advance when no one else has booked. Please check back later or choose another class.",
                });
              }
            }
          }

          // Check for duplicate booking
          const existingBooking = await tx.classBooking.findFirst({
            where: {
              sessionId: input.sessionId,
              userId,
              status: "confirmed",
            },
          });

          if (existingBooking) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "You already have a booking for this class.",
            });
          }

          // Create booking
          const booking = await tx.classBooking.create({
            data: {
              sessionId: input.sessionId,
              userId,
              guestName: user.name || "Member",
              guestEmail: user.email,
              guestPhone: user.phone,
              status: "confirmed",
              notes: input.notes,
            },
          });

          // Increment booked count
          await tx.classSession.update({
            where: { id: input.sessionId },
            data: { bookedCount: { increment: 1 } },
          });

          return booking;
        },
        {
          isolationLevel: "Serializable",
          timeout: 10000,
        }
      );

      // Deduct session from membership (outside transaction for proper handling)
      await deductSession(membershipCheck.membershipId!, result.id);

      // Get updated membership status
      const updatedMembership = await validateMembershipForBooking(userId);

      return {
        success: true,
        confirmationCode: result.confirmationCode,
        booking: result,
        membershipInfo: {
          type: membershipCheck.membershipType,
          sessionsRemaining: updatedMembership.sessionsRemaining,
          planName: membershipCheck.planName,
        },
      };
    }),

  // Cancel booking with session refund (for authenticated users)
  cancelAuthenticatedBooking: protectedProcedure
    .input(z.object({ confirmationCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      return ctx.db.$transaction(async (tx) => {
        const booking = await tx.classBooking.findUnique({
          where: { confirmationCode: input.confirmationCode },
          include: { session: true },
        });

        if (!booking) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Booking not found",
          });
        }

        if (booking.userId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This is not your booking",
          });
        }

        if (booking.status !== "confirmed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Booking is already cancelled or completed",
          });
        }

        // Check cancellation policy (2 hours before class)
        const classTime = new Date(booking.session.startTime);
        const now = new Date();
        const hoursUntilClass =
          (classTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilClass < 2) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot cancel within 2 hours of class start. Session will not be refunded.",
          });
        }

        // Cancel booking
        await tx.classBooking.update({
          where: { id: booking.id },
          data: { status: "cancelled" },
        });

        // Decrement booked count
        await tx.classSession.update({
          where: { id: booking.sessionId },
          data: { bookedCount: { decrement: 1 } },
        });

        // Refund session to membership
        await refundSession(booking.id);

        return {
          success: true,
          message: "Booking cancelled and session refunded",
        };
      });
    }),

  // Get user's upcoming bookings
  getMyBookings: protectedProcedure
    .input(
      z.object({
        includeHistory: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const now = new Date();

      return ctx.db.classBooking.findMany({
        where: {
          userId,
          ...(input.includeHistory
            ? {}
            : {
                session: { startTime: { gte: now } },
                status: "confirmed",
              }),
        },
        include: {
          session: {
            include: {
              classType: true,
              instructor: true,
            },
          },
        },
        orderBy: { session: { startTime: "asc" } },
      });
    }),
});

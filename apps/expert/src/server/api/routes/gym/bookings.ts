import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { refundCredits } from "~/server/services/creditsService";

export const bookingsRouter = createTRPCRouter({
  // Get all bookings (filtered by instructor for coaches)
  getAll: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        sessionId: z.string().optional(),
        status: z.enum(["confirmed", "cancelled", "no_show", "completed"]).optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Get current user's role and check if they're an instructor
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          instructor: {
            select: { id: true }
          }
        },
      });

      const whereClause: any = {};

      // If user is a coach, only show bookings for their sessions
      if (currentUser?.role === "coach") {
        if (!currentUser.instructor) {
          // Coach is not linked to an instructor profile, return empty
          return [];
        }
        whereClause.session = {
          instructorId: currentUser.instructor.id,
        };
      }

      if (input?.startDate || input?.endDate) {
        whereClause.session = {
          ...whereClause.session,
          startTime: {},
        };
        if (input?.startDate) {
          whereClause.session.startTime.gte = input.startDate;
        }
        if (input?.endDate) {
          whereClause.session.startTime.lte = input.endDate;
        }
      }

      if (input?.sessionId) {
        whereClause.sessionId = input.sessionId;
      }

      if (input?.status) {
        whereClause.status = input.status;
      }

      if (input?.search) {
        whereClause.OR = [
          { guestName: { contains: input.search, mode: "insensitive" } },
          { guestEmail: { contains: input.search, mode: "insensitive" } },
          { confirmationCode: { contains: input.search, mode: "insensitive" } },
        ];
      }

      return ctx.db.classBooking.findMany({
        where: whereClause,
        include: {
          session: {
            include: {
              classType: true,
              instructor: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Get single booking by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.db.classBooking.findUnique({
        where: { id: input.id },
        include: {
          session: {
            include: {
              classType: true,
              instructor: true,
            },
          },
          user: true,
        },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      return booking;
    }),

  // Get booking by confirmation code (admin lookup)
  getByCode: protectedProcedure
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
          user: true,
        },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      return booking;
    }),

  // Admin create booking (on behalf of guest)
  create: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().min(1, "Session is required"),
        guestName: z.string().min(1, "Guest name is required"),
        guestEmail: z.string().email("Valid email is required"),
        guestPhone: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(
        async (tx) => {
          // Lock the session row
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
              message: "Session is full",
            });
          }

          if (session.isCancelled) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Session has been cancelled",
            });
          }

          // Check for duplicate
          const existing = await tx.classBooking.findFirst({
            where: {
              sessionId: input.sessionId,
              guestEmail: input.guestEmail,
              status: "confirmed",
            },
          });

          if (existing) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Guest already has a booking for this session",
            });
          }

          // Create booking
          const booking = await tx.classBooking.create({
            data: {
              sessionId: input.sessionId,
              guestName: input.guestName,
              guestEmail: input.guestEmail,
              guestPhone: input.guestPhone,
              notes: input.notes,
              status: "confirmed",
            },
            include: {
              session: {
                include: {
                  classType: true,
                  instructor: true,
                },
              },
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
    }),

  // Cancel booking (shortcut for updateStatus with cancelled)
  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.classBooking.findUnique({
        where: { id: input.id },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // If confirmed, decrement the session count
      if (booking.status === "confirmed") {
        await ctx.db.classSession.update({
          where: { id: booking.sessionId },
          data: { bookedCount: { decrement: 1 } },
        });
        // Return any credits spent on this booking (no-op if it wasn't paid
        // with credits).
        await refundCredits(booking.id);
      }

      return ctx.db.classBooking.update({
        where: { id: input.id },
        data: { status: "cancelled" },
        include: {
          session: {
            include: {
              classType: true,
              instructor: true,
            },
          },
        },
      });
    }),

  // Update booking status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["confirmed", "cancelled", "no_show", "completed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.classBooking.findUnique({
        where: { id: input.id },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // If cancelling a confirmed booking, decrement count
      if (booking.status === "confirmed" && input.status === "cancelled") {
        await ctx.db.classSession.update({
          where: { id: booking.sessionId },
          data: { bookedCount: { decrement: 1 } },
        });
        await refundCredits(booking.id);
      }

      // If confirming a cancelled booking, increment count
      if (booking.status === "cancelled" && input.status === "confirmed") {
        const session = await ctx.db.classSession.findUnique({
          where: { id: booking.sessionId },
        });

        if (session && session.bookedCount >= session.capacity) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Session is full, cannot restore booking",
          });
        }

        await ctx.db.classSession.update({
          where: { id: booking.sessionId },
          data: { bookedCount: { increment: 1 } },
        });
      }

      return ctx.db.classBooking.update({
        where: { id: input.id },
        data: { status: input.status },
        include: {
          session: {
            include: {
              classType: true,
              instructor: true,
            },
          },
        },
      });
    }),

  // Update booking notes
  updateNotes: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.classBooking.findUnique({
        where: { id: input.id },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      return ctx.db.classBooking.update({
        where: { id: input.id },
        data: { notes: input.notes },
      });
    }),

  // Delete booking (hard delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.classBooking.findUnique({
        where: { id: input.id },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // If confirmed, decrement the session count
      if (booking.status === "confirmed") {
        await ctx.db.classSession.update({
          where: { id: booking.sessionId },
          data: { bookedCount: { decrement: 1 } },
        });
        // Refund credits before the hard delete (the booking row, and its
        // unique bookingId on the ledger, are about to go away).
        await refundCredits(booking.id);
      }

      return ctx.db.classBooking.delete({
        where: { id: input.id },
      });
    }),

  // Get booking statistics (filtered by instructor for coaches)
  getStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Get current user's role and check if they're an instructor
      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          instructor: {
            select: { id: true }
          }
        },
      });

      const whereClause: any = {};

      // If user is a coach, only show stats for their sessions
      if (currentUser?.role === "coach") {
        if (!currentUser.instructor) {
          return {
            total: 0,
            confirmed: 0,
            cancelled: 0,
            noShow: 0,
            completed: 0,
          };
        }
        whereClause.session = {
          instructorId: currentUser.instructor.id,
        };
      }

      if (input?.startDate || input?.endDate) {
        whereClause.session = {
          ...whereClause.session,
          startTime: {},
        };
        if (input?.startDate) {
          whereClause.session.startTime.gte = input.startDate;
        }
        if (input?.endDate) {
          whereClause.session.startTime.lte = input.endDate;
        }
      }

      const [total, confirmed, cancelled, noShow, completed] = await Promise.all([
        ctx.db.classBooking.count({ where: whereClause }),
        ctx.db.classBooking.count({ where: { ...whereClause, status: "confirmed" } }),
        ctx.db.classBooking.count({ where: { ...whereClause, status: "cancelled" } }),
        ctx.db.classBooking.count({ where: { ...whereClause, status: "no_show" } }),
        ctx.db.classBooking.count({ where: { ...whereClause, status: "completed" } }),
      ]);

      return { total, confirmed, cancelled, noShow, completed };
    }),
});

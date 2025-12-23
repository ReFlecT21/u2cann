import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "@adh/db";

export const customerClinicRouter = createTRPCRouter({
  // Get all clinics with optional filtering
  getAll: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      location: z.string().optional(),
      rating: z.number().optional(),
      sortBy: z.enum(['distance', 'rating', 'name']).optional().default('distance'),
    }))
    .query(async ({ input }) => {
      const where = {
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' as const } },
            { address: { contains: input.search, mode: 'insensitive' as const } },
          ],
        }),
        ...(input.location && {
          address: { contains: input.location, mode: 'insensitive' as const },
        }),
        ...(input.rating && {
          rating: { gte: input.rating },
        }),
      };

      let orderBy;
      switch (input.sortBy) {
        case 'rating':
          orderBy = { rating: 'desc' as const };
          break;
        case 'name':
          orderBy = { name: 'asc' as const };
          break;
        default: // distance
          orderBy = { name: 'asc' as const }; // placeholder - would calculate distance in real app
          break;
      }

      return await db.vetClinic.findMany({
        where,
        orderBy,
        include: {
          services: true,
          veterinarians: true,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      });
    }),

  // Get clinic by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.vetClinic.findUnique({
        where: { id: input.id },
        include: {
          services: true,
          veterinarians: true,
          reviews: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          timeSlots: {
            where: {
              date: {
                gte: new Date(),
              },
              available: true,
            },
            orderBy: [
              { date: 'asc' },
              { time: 'asc' },
            ],
          },
        },
      });
    }),

  // Get available time slots for a clinic on a specific date
  getTimeSlots: publicProcedure
    .input(z.object({
      clinicId: z.string(),
      date: z.date(),
    }))
    .query(async ({ input }) => {
      return await db.timeSlot.findMany({
        where: {
          clinicId: input.clinicId,
          date: {
            gte: new Date(input.date.setHours(0, 0, 0, 0)),
            lt: new Date(input.date.setHours(23, 59, 59, 999)),
          },
          available: true,
        },
        orderBy: { time: 'asc' },
      });
    }),
});
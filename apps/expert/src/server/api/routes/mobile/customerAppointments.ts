import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "@adh/db";

export const customerAppointmentRouter = createTRPCRouter({
  // Get customer's appointments
  getUserAppointments: publicProcedure
    .input(z.object({
      userId: z.string(),
      status: z.enum(['UPCOMING', 'COMPLETED', 'ALL']).optional().default('ALL'),
    }))
    .query(async ({ input }) => {
      const now = new Date();

      const where = {
        customerId: input.userId,
        ...(input.status === 'UPCOMING' && {
          OR: [
            { status: 'CONFIRMED' as const },
            { status: 'PENDING' as const },
          ],
          date: { gte: now },
        }),
        ...(input.status === 'COMPLETED' && {
          OR: [
            { status: 'completed' as const },
            { date: { lt: now } },
          ],
        }),
      };

      return await db.appointment.findMany({
        where,
        include: {
          pet: true,
          clinic: true,
          veterinarian: true,
          service: true,
        },
        orderBy: {
          date: 'desc'
        },
      });
    }),

  // Create new appointment
  create: publicProcedure
    .input(z.object({
      date: z.date(),
      time: z.string(),
      userId: z.string(),
      petId: z.string(),
      clinicId: z.string(),
      serviceId: z.string(),
      veterinarianId: z.string().optional(),
      timeSlotId: z.string().optional(),
      doctorPreference: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Mark time slot as unavailable if provided
      if (input.timeSlotId) {
        await db.timeSlot.update({
          where: { id: input.timeSlotId },
          data: { available: false },
        });
      }

      const { userId, ...appointmentData } = input;
      return await db.appointment.create({
        data: {
          ...appointmentData,
          customerId: userId,
          // Set start/end times based on date and time for expert app compatibility
          startTime: new Date(`${appointmentData.date.toISOString().split('T')[0]}T${appointmentData.time}`),
          endTime: new Date(`${appointmentData.date.toISOString().split('T')[0]}T${appointmentData.time}`),
        },
        include: {
          pet: true,
          clinic: true,
          veterinarian: true,
          service: true,
        },
      });
    }),

  // Update appointment
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      date: z.date().optional(),
      time: z.string().optional(),
      status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'completed', 'cancelled', 'NO_SHOW']).optional(),
      notes: z.string().optional(),
      veterinarianId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.appointment.update({
        where: { id },
        data,
        include: {
          pet: true,
          clinic: true,
          veterinarian: true,
          service: true,
        },
      });
    }),

  // Cancel appointment
  cancel: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const appointment = await db.appointment.update({
        where: { id: input.id },
        data: { status: 'cancelled' },
      });

      // Free up the time slot if it exists
      if (appointment.timeSlotId) {
        await db.timeSlot.update({
          where: { id: appointment.timeSlotId },
          data: { available: true },
        });
      }

      return appointment;
    }),
});
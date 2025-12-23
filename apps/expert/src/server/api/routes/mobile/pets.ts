import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "@adh/db";

export const customerPetRouter = createTRPCRouter({
  // Get customer's pets
  getUserPets: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await db.pet.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: 'desc' },
      });
    }),

  // Create new pet
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      species: z.string(),
      breed: z.string().optional(),
      age: z.number().optional(),
      weight: z.number().optional(),
      avatar: z.string().optional(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { userId, ...petData } = input;
      return await db.pet.create({
        data: {
          ...petData,
          userId: userId,
        },
      });
    }),

  // Update pet
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      species: z.string().optional(),
      breed: z.string().optional(),
      age: z.number().optional(),
      weight: z.number().optional(),
      avatar: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.pet.update({
        where: { id },
        data,
      });
    }),

  // Delete pet
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.pet.delete({
        where: { id: input.id },
      });
    }),
});
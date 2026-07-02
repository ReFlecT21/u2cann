import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import {
  getBalance,
  getTransactions,
  grantCredits,
  revokeCredits,
} from "~/server/services/creditsService";

export const creditsRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Credit products (admin-managed mapping: Stripe product -> credits granted)
  // ---------------------------------------------------------------------------
  listProducts: adminProcedure.query(({ ctx }) =>
    ctx.db.creditProduct.findMany({ orderBy: { createdAt: "desc" } })
  ),

  createProduct: adminProcedure
    .input(
      z
        .object({
          stripeProductId: z.string().optional(),
          stripePriceId: z.string().optional(),
          name: z.string().min(1),
          creditsGranted: z.number().int().positive(),
          priceInCents: z.number().int().min(0),
          isActive: z.boolean().default(true),
        })
        .refine((v) => v.stripeProductId || v.stripePriceId, {
          message: "Provide a Stripe product ID or price ID",
          path: ["stripeProductId"],
        })
    )
    .mutation(({ ctx, input }) =>
      ctx.db.creditProduct.create({ data: input })
    ),

  updateProduct: adminProcedure
    .input(
      z.object({
        id: z.string(),
        stripeProductId: z.string().min(1).optional(),
        stripePriceId: z.string().optional(),
        name: z.string().min(1).optional(),
        creditsGranted: z.number().int().positive().optional(),
        priceInCents: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.creditProduct.update({ where: { id }, data });
    }),

  deleteProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      // Soft-delete so historical transactions keep their product link.
      ctx.db.creditProduct.update({
        where: { id: input.id },
        data: { isActive: false },
      })
    ),

  // ---------------------------------------------------------------------------
  // Per-class-type credit cost
  // ---------------------------------------------------------------------------
  listClassTypeCosts: adminProcedure.query(({ ctx }) =>
    ctx.db.gymClassType.findMany({
      orderBy: { displayName: "asc" },
      select: { id: true, name: true, displayName: true, creditCost: true },
    })
  ),

  setClassTypeCost: adminProcedure
    .input(
      z.object({
        classTypeId: z.string(),
        creditCost: z.number().int().min(0),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.db.gymClassType.update({
        where: { id: input.classTypeId },
        data: { creditCost: input.creditCost },
      })
    ),

  // ---------------------------------------------------------------------------
  // User wallet administration
  // ---------------------------------------------------------------------------
  getUserCredits: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => ({
      balance: await getBalance(input.userId),
      transactions: await getTransactions(input.userId),
    })),

  adjustUserCredits: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        amount: z.number().int().refine((n) => n !== 0, "Amount cannot be zero"),
        reason: z.string().min(1, "Reason is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.auth.userId;
      if (input.amount > 0) {
        const { balanceAfter } = await grantCredits({
          userId: input.userId,
          amount: input.amount,
          type: "ADMIN_ADJUST",
          reason: input.reason,
          sourceRef: `admin:${adminId}`,
        });
        return { balance: balanceAfter };
      }
      const { balanceAfter, revoked } = await revokeCredits({
        userId: input.userId,
        amount: Math.abs(input.amount),
        reason: input.reason,
        sourceRef: `admin:${adminId}`,
      });
      if (revoked < Math.abs(input.amount)) {
        // Surface the clamp so the admin isn't surprised.
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Only ${revoked} credit(s) were available to revoke. Balance is now ${balanceAfter}.`,
        });
      }
      return { balance: balanceAfter };
    }),

  // ---------------------------------------------------------------------------
  // Member-facing (own wallet)
  // ---------------------------------------------------------------------------
  getMyBalance: protectedProcedure.query(({ ctx }) =>
    getBalance(ctx.auth.userId)
  ),

  getMyTransactions: protectedProcedure.query(({ ctx }) =>
    getTransactions(ctx.auth.userId)
  ),
});

import { db } from "@adh/db";
import { TRPCError } from "@trpc/server";
import type { Prisma, CreditTransactionType } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export interface CreditValidationResult {
  isValid: boolean;
  balance: number;
  cost: number;
  reason?: string;
}

/**
 * Current credit balance for a user. Returns 0 if they have no wallet yet.
 */
export async function getBalance(userId: string): Promise<number> {
  const wallet = await db.creditWallet.findUnique({
    where: { userId },
    select: { balance: true },
  });
  return wallet?.balance ?? 0;
}

/**
 * Find-or-create the user's wallet inside a transaction. Returns id + balance.
 */
async function ensureWallet(
  tx: Tx,
  userId: string
): Promise<{ id: string; balance: number }> {
  const existing = await tx.creditWallet.findUnique({
    where: { userId },
    select: { id: true, balance: true },
  });
  if (existing) return existing;

  const created = await tx.creditWallet.create({
    data: { userId },
    select: { id: true, balance: true },
  });
  return created;
}

/**
 * Grant credits to a user (a purchase or a positive admin adjustment).
 * Atomic: increments the wallet and writes a ledger row in one transaction.
 * Pass `tx` to run inside an outer transaction (e.g. the Stripe webhook).
 */
export async function grantCredits(args: {
  userId: string;
  amount: number; // must be > 0
  type: Extract<CreditTransactionType, "PURCHASE" | "ADMIN_ADJUST">;
  reason?: string;
  productId?: string;
  sourceRef?: string;
  tx?: Tx;
}): Promise<{ balanceAfter: number }> {
  if (args.amount <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Grant amount must be positive",
    });
  }

  const run = async (tx: Tx) => {
    const wallet = await ensureWallet(tx, args.userId);
    const updated = await tx.creditWallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: args.amount } },
      select: { balance: true },
    });
    await tx.creditTransaction.create({
      data: {
        walletId: wallet.id,
        userId: args.userId,
        type: args.type,
        amount: args.amount,
        balanceAfter: updated.balance,
        reason: args.reason,
        productId: args.productId,
        sourceRef: args.sourceRef,
      },
    });
    return { balanceAfter: updated.balance };
  };

  return args.tx ? run(args.tx) : db.$transaction(run);
}

/**
 * Spend credits for a booking. MUST run inside the booking transaction so the
 * deduction is atomic with creating the booking row. Overspend-safe: the
 * guarded updateMany only decrements when balance >= amount; if it doesn't
 * affect a row we throw, which rolls back the whole booking.
 */
export async function spendCredits(args: {
  tx: Tx;
  userId: string;
  amount: number;
  bookingId: string;
  reason?: string;
}): Promise<{ balanceAfter: number }> {
  const wallet = await ensureWallet(args.tx, args.userId);

  const result = await args.tx.creditWallet.updateMany({
    where: { id: wallet.id, balance: { gte: args.amount } },
    data: { balance: { decrement: args.amount } },
  });

  if (result.count !== 1) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Not enough credits. This class costs ${args.amount} credit(s) but you have ${wallet.balance}.`,
    });
  }

  const balanceAfter = wallet.balance - args.amount;
  await args.tx.creditTransaction.create({
    data: {
      walletId: wallet.id,
      userId: args.userId,
      type: "BOOKING_SPEND",
      amount: -args.amount,
      balanceAfter,
      bookingId: args.bookingId,
      reason: args.reason,
    },
  });

  return { balanceAfter };
}

/**
 * Refund the credits spent on a booking (cancellation). Returns false when the
 * booking was NOT paid with credits (e.g. it used a membership session) so the
 * caller can fall back to refundSession. Idempotent: a second refund is a no-op.
 * Pass `tx` to run inside an outer transaction.
 */
export async function refundCredits(
  bookingId: string,
  tx?: Tx
): Promise<boolean> {
  const run = async (tx: Tx): Promise<boolean> => {
    const spend = await tx.creditTransaction.findFirst({
      where: { bookingId, type: "BOOKING_SPEND" },
    });
    if (!spend) return false; // not a credit-paid booking

    // Already refunded? (guard against double refunds)
    const alreadyRefunded = await tx.creditTransaction.findFirst({
      where: { bookingId, type: "BOOKING_REFUND" },
    });
    if (alreadyRefunded) return true;

    const amount = Math.abs(spend.amount);
    const updated = await tx.creditWallet.update({
      where: { id: spend.walletId },
      data: { balance: { increment: amount } },
      select: { balance: true },
    });
    await tx.creditTransaction.create({
      data: {
        walletId: spend.walletId,
        userId: spend.userId,
        type: "BOOKING_REFUND",
        amount,
        balanceAfter: updated.balance,
        bookingId,
        reason: "Booking cancelled",
      },
    });
    return true;
  };

  return tx ? run(tx) : db.$transaction(run);
}

/**
 * Revoke credits (a negative admin adjustment). Guarded so balance never goes
 * below 0 — the effective revoke is clamped to the current balance.
 */
export async function revokeCredits(args: {
  userId: string;
  amount: number; // positive number of credits to remove
  reason?: string;
  sourceRef?: string;
}): Promise<{ balanceAfter: number; revoked: number }> {
  if (args.amount <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Revoke amount must be positive",
    });
  }
  return db.$transaction(async (tx) => {
    const wallet = await ensureWallet(tx, args.userId);
    const revoked = Math.min(args.amount, wallet.balance);
    if (revoked === 0) return { balanceAfter: wallet.balance, revoked: 0 };

    const updated = await tx.creditWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: revoked } },
      select: { balance: true },
    });
    await tx.creditTransaction.create({
      data: {
        walletId: wallet.id,
        userId: args.userId,
        type: "ADMIN_ADJUST",
        amount: -revoked,
        balanceAfter: updated.balance,
        reason: args.reason,
        sourceRef: args.sourceRef,
      },
    });
    return { balanceAfter: updated.balance, revoked };
  });
}

/**
 * Read-only pre-check: can this user pay for a class of the given type with
 * credits? Used to branch the booking flow and to drive the booking UI.
 */
export async function validateCreditsForBooking(
  userId: string,
  classTypeId: string
): Promise<CreditValidationResult> {
  const [balance, classType] = await Promise.all([
    getBalance(userId),
    db.gymClassType.findUnique({
      where: { id: classTypeId },
      select: { creditCost: true },
    }),
  ]);

  const cost = classType?.creditCost ?? 1;

  if (balance < cost) {
    return {
      isValid: false,
      balance,
      cost,
      reason: `Not enough credits (need ${cost}, have ${balance})`,
    };
  }

  return { isValid: true, balance, cost };
}

/**
 * Ledger history for a user (admin + member views).
 */
export async function getTransactions(userId: string, limit = 50) {
  return db.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { product: { select: { name: true } } },
  });
}

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { deleteFromS3 } from "~/server/lib/s3";
import {
  removeFaceFromDevices,
  syncFaceProfile,
} from "~/server/lib/faceSync";

async function requireAdmin(
  db: typeof import("@adh/db").db,
  userId: string,
): Promise<void> {
  const me = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
}

export const faceEnrollmentRouter = createTRPCRouter({
  // Member: get their own face profile
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.faceProfile.findUnique({
      where: { userId: ctx.auth.userId! },
    });
  }),

  // Admin: get a specific user's face profile
  getByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireAdmin(ctx.db, ctx.auth.userId!);
      return ctx.db.faceProfile.findUnique({
        where: { userId: input.userId },
      });
    }),

  // Admin: list all pending approvals
  listPending: protectedProcedure.query(async ({ ctx }) => {
    await requireAdmin(ctx.db, ctx.auth.userId!);
    return ctx.db.faceProfile.findMany({
      where: { approvalStatus: "PENDING" },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  // Admin: count of pending approvals (for badge)
  pendingCount: protectedProcedure.query(async ({ ctx }) => {
    await requireAdmin(ctx.db, ctx.auth.userId!);
    return ctx.db.faceProfile.count({
      where: { approvalStatus: "PENDING" },
    });
  }),

  // Admin: approve a pending profile
  approve: protectedProcedure
    .input(z.object({ profileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.db, ctx.auth.userId!);
      const updated = await ctx.db.faceProfile.update({
        where: { id: input.profileId },
        data: {
          approvalStatus: "APPROVED",
          approvedBy: ctx.auth.userId!,
          approvedAt: new Date(),
          rejectionReason: null,
          syncStatus: "PENDING",
          syncError: null,
        },
      });
      // Fire-and-forget bridge sync — UI polls syncStatus
      void syncFaceProfile(updated.id).catch((err) => {
        console.error("[faceEnrollment] sync failed", err);
      });
      return updated;
    }),

  // Admin: manually retry syncing an approved profile
  retrySync: protectedProcedure
    .input(z.object({ profileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.db, ctx.auth.userId!);
      return syncFaceProfile(input.profileId);
    }),

  // Admin: reject a pending profile
  reject: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        reason: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.db, ctx.auth.userId!);
      return ctx.db.faceProfile.update({
        where: { id: input.profileId },
        data: {
          approvalStatus: "REJECTED",
          rejectionReason: input.reason,
          approvedBy: ctx.auth.userId!,
          approvedAt: new Date(),
        },
      });
    }),

  // Member (own) or admin (any): delete a face profile
  delete: protectedProcedure
    .input(z.object({ profileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.db.faceProfile.findUnique({
        where: { id: input.profileId },
      });
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }

      const isOwner = profile.userId === ctx.auth.userId;
      if (!isOwner) {
        await requireAdmin(ctx.db, ctx.auth.userId!);
      }

      if (profile.faceImageS3Key) {
        try {
          await deleteFromS3(profile.faceImageS3Key);
        } catch (err) {
          console.error("[faceEnrollment] failed to delete S3 object", err);
        }
      }

      try {
        await removeFaceFromDevices(profile.hikvisionEmployeeNo);
      } catch (err) {
        console.error("[faceEnrollment] failed to remove from devices", err);
      }

      await ctx.db.faceProfile.delete({ where: { id: profile.id } });
      return { success: true };
    }),
});

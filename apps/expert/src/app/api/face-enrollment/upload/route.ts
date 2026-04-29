import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@adh/db";
import { uploadToS3, deleteFromS3 } from "~/server/lib/s3";
import { syncFaceProfile } from "~/server/lib/faceSync";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

async function generateEmployeeNumber(): Promise<string> {
  const result = await db.$queryRaw<Array<{ max_no: number | null }>>`
    SELECT MAX(CAST("hikvisionEmployeeNo" AS INTEGER)) AS max_no
    FROM face_profiles
    WHERE "hikvisionEmployeeNo" ~ '^[0-9]+$'
  `;
  const next = (result[0]?.max_no ?? 0) + 1;
  return next.toString();
}

export async function POST(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caller = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!caller) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("faceImage");
  const targetUserIdRaw = formData.get("targetUserId");
  const targetUserId =
    typeof targetUserIdRaw === "string" && targetUserIdRaw.length > 0
      ? targetUserIdRaw
      : null;

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing faceImage file" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG and PNG images are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Image must be under 5MB" },
      { status: 400 },
    );
  }

  // Admin can upload on behalf by passing targetUserId
  let subjectUserId = userId;
  let isAdminUpload = false;
  if (targetUserId && targetUserId !== userId) {
    if (caller.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can upload on behalf of another user" },
        { status: 403 },
      );
    }
    subjectUserId = targetUserId;
    isAdminUpload = true;
  }

  const subject = await db.user.findUnique({
    where: { id: subjectUserId },
    select: { id: true },
  });
  if (!subject) {
    return NextResponse.json(
      { error: "Target user not found" },
      { status: 404 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.type === "image/png" ? "png" : "jpg";
  const key = `face-enrollment/${subjectUserId}/${Date.now()}.${ext}`;
  const { url } = await uploadToS3(buffer, key, file.type);

  const existing = await db.faceProfile.findUnique({
    where: { userId: subjectUserId },
  });

  // Admin upload = auto-approved; member self-upload = pending approval
  const approvalStatus = isAdminUpload ? "APPROVED" : "PENDING";
  const approvalFields = isAdminUpload
    ? { approvedBy: userId, approvedAt: new Date(), rejectionReason: null }
    : {
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
      };

  let profile;
  if (existing) {
    // Replace old S3 object
    if (existing.faceImageS3Key && existing.faceImageS3Key !== key) {
      try {
        await deleteFromS3(existing.faceImageS3Key);
      } catch (err) {
        console.error("[face-enrollment] failed to delete old S3 object", err);
      }
    }
    profile = await db.faceProfile.update({
      where: { userId: subjectUserId },
      data: {
        faceImageUrl: url,
        faceImageS3Key: key,
        approvalStatus,
        syncStatus: "PENDING",
        syncError: null,
        syncedAt: null,
        uploadedByAdminId: isAdminUpload ? userId : null,
        ...approvalFields,
      },
    });
  } else {
    const employeeNo = await generateEmployeeNumber();
    profile = await db.faceProfile.create({
      data: {
        userId: subjectUserId,
        faceImageUrl: url,
        faceImageS3Key: key,
        hikvisionEmployeeNo: employeeNo,
        approvalStatus,
        syncStatus: "PENDING",
        uploadedByAdminId: isAdminUpload ? userId : null,
        ...approvalFields,
      },
    });
  }

  // Auto-approved (admin upload) → push to cameras in background
  if (profile.approvalStatus === "APPROVED") {
    void syncFaceProfile(profile.id).catch((err) => {
      console.error("[face-enrollment] sync failed", err);
    });
  }

  return NextResponse.json({ profile });
}

"use client";

import { useRef, useState } from "react";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@adh/ui/ui/card";
import { Button } from "@adh/ui/ui/button";
import { Badge } from "@adh/ui/ui/badge";
import { Skeleton } from "@adh/ui/ui/skeleton";
import { Alert, AlertDescription } from "@adh/ui/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@adh/ui/ui/alert-dialog";
import { toast } from "sonner";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function StatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  if (status === "APPROVED") {
    return <Badge className="bg-green-500 text-white">Approved</Badge>;
  }
  if (status === "REJECTED") {
    return <Badge className="bg-red-500 text-white">Rejected</Badge>;
  }
  return <Badge className="bg-yellow-500 text-white">Pending Approval</Badge>;
}

export function FaceEnrollmentCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const utils = api.useUtils();
  const { data: profile, isLoading } = api.gym.faceEnrollment.getMyProfile.useQuery();

  const deleteMutation = api.gym.faceEnrollment.delete.useMutation({
    onSuccess: () => {
      toast.success("Face photo removed");
      utils.gym.faceEnrollment.getMyProfile.invalidate();
      setDeleteOpen(false);
    },
    onError: (err) => toast.error(err.message || "Failed to remove photo"),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Only JPEG and PNG images are allowed");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("faceImage", file);
      const res = await fetch("/api/face-enrollment/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Upload failed");
      }
      toast.success("Face photo uploaded — awaiting admin approval");
      utils.gym.faceEnrollment.getMyProfile.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Face Enrollment
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a clear photo of your face to enable entry at the gym.
          Staff will review and approve it.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-40 w-40" />
        ) : profile ? (
          <div className="flex items-start gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.faceImageUrl}
              alt="Your face"
              className="h-40 w-40 rounded-md object-cover border"
            />
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <StatusBadge status={profile.approvalStatus} />
              </div>
              {profile.approvalStatus === "REJECTED" && profile.rejectionReason && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Reason:</strong> {profile.rejectionReason}
                  </AlertDescription>
                </Alert>
              )}
              {profile.approvalStatus === "PENDING" && (
                <p className="text-sm text-muted-foreground">
                  A staff member will review your photo shortly.
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Replace photo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  disabled={uploading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              No face photo uploaded yet.
            </p>
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload photo
            </Button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleFileChange}
        />

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove face photo?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete your enrolled photo. You'll need to upload and
                get approval again to enter the gym via face recognition.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  profile &&
                  deleteMutation.mutate({ profileId: profile.id })
                }
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

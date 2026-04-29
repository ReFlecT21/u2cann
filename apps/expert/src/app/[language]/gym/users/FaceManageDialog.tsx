"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@adh/ui/ui/dialog";
import { Button } from "@adh/ui/ui/button";
import { Badge } from "@adh/ui/ui/badge";
import { Skeleton } from "@adh/ui/ui/skeleton";
import { Textarea } from "@adh/ui/ui/text-area";
import { Alert, AlertDescription } from "@adh/ui/ui/alert";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Camera, Check, Loader2, RefreshCw, Trash2, Upload, X } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface FaceManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: { id: string; name: string | null; email: string } | null;
}

function StatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  if (status === "APPROVED") {
    return <Badge className="bg-green-500 text-white">Approved</Badge>;
  }
  if (status === "REJECTED") {
    return <Badge className="bg-red-500 text-white">Rejected</Badge>;
  }
  return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
}

function SyncBadge({
  status,
}: {
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
}) {
  if (status === "SYNCED") {
    return <Badge className="bg-blue-500 text-white">Synced to camera</Badge>;
  }
  if (status === "SYNCING") {
    return <Badge className="bg-blue-400 text-white">Syncing…</Badge>;
  }
  if (status === "FAILED") {
    return <Badge className="bg-red-500 text-white">Sync failed</Badge>;
  }
  return <Badge variant="outline">Not synced</Badge>;
}

export function FaceManageDialog({
  open,
  onOpenChange,
  targetUser,
}: FaceManageDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const utils = api.useUtils();

  const { data: profile, isLoading } = api.gym.faceEnrollment.getByUserId.useQuery(
    { userId: targetUser?.id ?? "" },
    { enabled: !!targetUser?.id && open },
  );

  const invalidateAll = () => {
    utils.gym.faceEnrollment.getByUserId.invalidate({
      userId: targetUser?.id ?? "",
    });
    utils.gym.faceEnrollment.listPending.invalidate();
    utils.gym.faceEnrollment.pendingCount.invalidate();
  };

  const approveMutation = api.gym.faceEnrollment.approve.useMutation({
    onSuccess: () => {
      toast.success("Face profile approved");
      invalidateAll();
    },
    onError: (err) => toast.error(err.message || "Failed to approve"),
  });

  const rejectMutation = api.gym.faceEnrollment.reject.useMutation({
    onSuccess: () => {
      toast.success("Face profile rejected");
      invalidateAll();
      setRejectMode(false);
      setRejectReason("");
    },
    onError: (err) => toast.error(err.message || "Failed to reject"),
  });

  const deleteMutation = api.gym.faceEnrollment.delete.useMutation({
    onSuccess: () => {
      toast.success("Face profile removed");
      invalidateAll();
    },
    onError: (err) => toast.error(err.message || "Failed to remove"),
  });

  const retrySyncMutation = api.gym.faceEnrollment.retrySync.useMutation({
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Synced to all cameras");
      } else if (res.skipped) {
        toast.error(res.skipped);
      } else {
        const failed = res.results.filter((r) => !r.success);
        toast.error(
          failed
            .map((r) => `${r.deviceName}: ${r.error ?? "unknown error"}`)
            .join("; ") || "Sync failed",
        );
      }
      invalidateAll();
    },
    onError: (err) => toast.error(err.message || "Sync failed"),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUser) return;

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
      formData.append("targetUserId", targetUser.id);
      const res = await fetch("/api/face-enrollment/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Upload failed");
      }
      toast.success("Face photo uploaded and approved");
      invalidateAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Face Enrollment
          </DialogTitle>
          <DialogDescription>
            {targetUser?.name || targetUser?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-40 w-40" />
          ) : profile ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.faceImageUrl}
                  alt="Face"
                  className="h-40 w-40 rounded-md object-cover border"
                />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <StatusBadge status={profile.approvalStatus} />
                  </div>
                  {profile.approvalStatus === "APPROVED" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Camera:</span>
                      <SyncBadge status={profile.syncStatus} />
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Employee #: {profile.hikvisionEmployeeNo}
                  </div>
                  {profile.uploadedByAdminId && (
                    <div className="text-xs text-muted-foreground">
                      Uploaded by admin
                    </div>
                  )}
                  {profile.approvalStatus === "REJECTED" &&
                    profile.rejectionReason && (
                      <Alert variant="destructive">
                        <AlertDescription className="text-xs">
                          <strong>Reason:</strong> {profile.rejectionReason}
                        </AlertDescription>
                      </Alert>
                    )}
                  {profile.syncStatus === "FAILED" && profile.syncError && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">
                        <strong>Sync error:</strong> {profile.syncError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {rejectMode ? (
                <div className="space-y-2">
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (e.g., face not clearly visible)"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        rejectMutation.mutate({
                          profileId: profile.id,
                          reason: rejectReason.trim(),
                        })
                      }
                      disabled={
                        !rejectReason.trim() || rejectMutation.isPending
                      }
                    >
                      {rejectMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Confirm Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectMode(false);
                        setRejectReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.approvalStatus === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          approveMutation.mutate({ profileId: profile.id })
                        }
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRejectMode(true)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {profile.approvalStatus === "APPROVED" &&
                    profile.syncStatus !== "SYNCING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          retrySyncMutation.mutate({ profileId: profile.id })
                        }
                        disabled={retrySyncMutation.isPending}
                      >
                        {retrySyncMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Sync to camera
                      </Button>
                    )}
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
                    onClick={() =>
                      deleteMutation.mutate({ profileId: profile.id })
                    }
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No face photo uploaded for this member yet.
              </p>
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload photo (auto-approved)
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

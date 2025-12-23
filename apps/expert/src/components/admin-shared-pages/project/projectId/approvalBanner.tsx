import React from "react";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription, AlertTitle } from "@adh/ui/ui/alert";
import { Button } from "@adh/ui/ui/button";
import { api } from "~/trpc/react";
import { toast } from "sonner";

export default function ApprovalBanner({
  projectId,
  refetch,
}: {
  projectId: string;
  refetch: () => void;
}) {
  const t = useTranslations("projectView");

  // Approve Project
  const approveProject = api.admin.project.approve.useMutation();
  const handleApproveProject = () => {
    approveProject.mutate(
      { pid: projectId },
      {
        onSuccess: () => {
          toast.success(t("approveSuccess"));
          refetch();
          window.location.reload();
        },
      },
    );
  };

  // Reject Project
  const rejectProject = api.admin.project.reject.useMutation();
  const handleRejectProject = () => {
    rejectProject.mutate(
      { pid: projectId },
      {
        onSuccess: () => {
          toast.success(t("rejectSuccess"));
          refetch();
          window.location.reload();
        },
      },
    );
  };

  return (
    <Alert variant="default">
      <AlertTitle>{t("approvalTitle")}</AlertTitle>
      <AlertDescription>
        {t("approvalDesc")}
      </AlertDescription>
      <div className="mt-4 flex space-x-4">
        <Button
          className="bg-green-600 hover:bg-green-700 dark:text-white"
          onClick={handleApproveProject}
        >
          {t("approve")}
        </Button>
        <Button
          className="bg-red-600 hover:bg-red-700 dark:text-white"
          onClick={handleRejectProject}
        >
          {t("reject")}
        </Button>
      </div>
    </Alert>
  );
}

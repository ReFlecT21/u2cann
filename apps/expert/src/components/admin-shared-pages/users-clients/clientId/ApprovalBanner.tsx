"use client";

import { Alert, AlertDescription, AlertTitle } from "@adh/ui/ui/alert";
import { CheckCircle2, Hourglass } from "lucide-react";
import { Button } from "@adh/ui/ui/button";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function ApprovalBanner({ userId }: { userId: number }) {
  const t = useTranslations("userClients");

  const utils = api.useUtils();

  const { data: user } = api.admin.clients.getClientDetails.useQuery({ clientId: userId });

  const approve = api.admin.clients.approveClient.useMutation({
    onSuccess: () => {
      toast.success(t("approveSuccess"));
      utils.admin.clients.invalidate();
    },
    onError: () => {
      toast.error(t("errorApprove"));
    },
  });

  const reject = api.admin.clients.rejectClient.useMutation({
    onSuccess: () => {
      toast.success(t("rejectSuccess"));
      utils.admin.clients.invalidate();
    },
    onError: () => {
      toast.error(t("errorReject"));
    },
  });

  if (!user) return null;

  if (user.status === "approved") {
    return (
      <Alert className="mb-4 border-green-400 text-green-800">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>{t("userApproved")}</AlertTitle>
        <AlertDescription>{t("userApprovedDesc")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-yellow-400 text-yellow-800">
      <Hourglass className="h-4 w-4" />
      <AlertTitle>{t("approvalPending")}</AlertTitle>
      <AlertDescription>{t("approvalDesc")}</AlertDescription>
      <div className="mt-4 flex flex-row gap-4">
        <Button
          variant="default"
          size="sm"
          onClick={() => approve.mutate({ clientId: userId })}
        >
          {t("approve")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => reject.mutate({ clientId: userId })}
        >
          {t("reject")}
        </Button>
      </div>
    </Alert>
  );
}

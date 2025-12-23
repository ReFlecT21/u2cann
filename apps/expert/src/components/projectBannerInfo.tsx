import { Alert, AlertDescription, AlertTitle } from "@adh/ui/ui/alert";
import { useTranslations } from "next-intl";

export default function ExpertBannerAlert({ status }: { status: string }) {
  const t = useTranslations("expertProjectBannerStatus");
  switch (status) {
    case "pending":
      return (
        <Alert variant="default">
          <AlertTitle>{t("pending.title")}</AlertTitle>
          <AlertDescription>
          {t("pending.description")}
          </AlertDescription>
        </Alert>
      );
    case "shortlist":
      return (
        <Alert variant="default">
          <AlertTitle>{t("shortlist.title")}</AlertTitle>
          <AlertDescription>
          {t("shortlist.description")}
          </AlertDescription>
        </Alert>
      );
    case "ongoing":
      return (
        <Alert variant="ongoing">
          <AlertTitle>{t("ongoing.title")}</AlertTitle>
          <AlertDescription>
          {t("ongoing.description")}
          </AlertDescription>
        </Alert>
      );
    case "closed":
      return (
        <Alert variant="default">
          <AlertTitle>{t("closed.title")}</AlertTitle>
          <AlertDescription>{t("closed.description")}</AlertDescription>
        </Alert>
      );
    case "rejected":
      return (
        <Alert variant="default">
          <AlertTitle>{t("rejected.title")}</AlertTitle>
          <AlertDescription>
          {t("rejected.description")}
          </AlertDescription>
        </Alert>
      );
    default:
      return null;
  }
}

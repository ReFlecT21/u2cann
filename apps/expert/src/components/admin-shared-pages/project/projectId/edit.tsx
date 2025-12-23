import { useTranslations } from "next-intl";

interface EditProjectProps {
  projectId: string;
}

export default function EditProject({ projectId }: EditProjectProps) {
  const t = useTranslations("projectView");

  return <div>{t("editProject")} {projectId}</div>;
}
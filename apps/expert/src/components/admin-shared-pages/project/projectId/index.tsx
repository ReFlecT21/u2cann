"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, MoreHorizontal, Trash, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@adh/ui/ui/button";
import { Card, CardContent } from "@adh/ui/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adh/ui/ui/dropdown-menu";
import { Label } from "@adh/ui/ui/label";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@adh/ui/ui/multi-select";
import { Skeleton } from "@adh/ui/ui/skeleton";

import ProjectDetails, {
  ProjectClientInfoDataType,
  ProjectInfoDataType,
  QuestionInfoDataType,
  TargetExpertDataType,
} from "~/components/ProjectDetails";
import { DataTable } from "~/components/ProjectExpertDataTable";
import ProjectStatusBadge from "~/components/ProjectStatusBadge";
import { api } from "~/trpc/react";
import InputBadgeTextBox from "../../../../components/InputBadgeDisplayBox";
import ApprovalBanner from "./approvalBanner";
import { getColumns, searchFilterFn } from "./columns";

interface ProjectIdPageProps {
  projectId: string;
  isSuperAdmin: boolean;
}

const projectCreateSchema = z.object({
  admin: z.array(z.string()).min(1), // Change to array for multi-select
});

export default function ProjectIdPage({
  projectId,
  isSuperAdmin,
}: ProjectIdPageProps) {
  const t = useTranslations("projectView");
  const router = useRouter();
  const columns = getColumns(isSuperAdmin);
  const {
    data,
    isLoading,
    error,
    refetch: refetch2,
  } = api.admin.project.showInfo.useQuery({
    pid: projectId,
  });
  console.log("projectId", projectId);
  const { mutateAsync } = api.admin.project.updateProjectHandleBy.useMutation(
    {},
  );
  const { data: isInAdminOrg } = api.admin.account.isUserInAdminOrg.useQuery();
  const { data: isApproved, refetch } =
    api.admin.project.checkApproved.useQuery({
      pid: projectId,
    });
  const { mutate: approveProject } = api.admin.project.approve.useMutation({
    onSuccess: () => {
      toast.success(t("approveSuccess"));
      window.location.reload();
      refetch();
    },
    onError: (error) => {
      toast.error(t("error") + ": " + error.message);
    },
  });
  const { mutate: rejectProject } = api.admin.project.reject.useMutation({
    onSuccess: () => {
      toast.success(t("rejectSuccess"));
      window.location.reload();
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  const { mutate: removeProject } = api.admin.project.delete.useMutation({
    onSuccess: () => {
      toast.success(t("removeSuccess"));
      router.push("/admin/projects");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  const { mutate: closeProject } = api.admin.project.close.useMutation({
    onSuccess: () => {
      toast.success(t("closeSuccess"));
      window.location.reload();
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof projectCreateSchema>>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: {
      admin: [], // Default value for multi-select
    },
  });

  // useEffect(() => {
  //   if (admin && admin.length > 0) {
  //     setValue("admin", admin);
  //   }
  // }, [admin]);
  const handleEditClick = () => {
    const userIds = data?.projectUsers?.map((user) => user.email) ?? [];
    setValue("admin", userIds);
    setIsEditing(true);
  };
  useEffect(() => {
    console.log("testLOL", isEditing);
  }, [isEditing]);
  useEffect(() => {
    refetch2();
  }, [projectId, refetch2]);
  // Handle form submission
  const onSubmit = async (formData: z.infer<typeof projectCreateSchema>) => {
    await mutateAsync({ pid: projectId, handleBy: formData.admin });
    // Call the sendEmail mutation

    toast.success(t("updateSuccess"));
    setIsEditing(false);
    window.location.reload();
  };
  console.log("data", data?.projectInfo?.project_users);
  if (isLoading) {
    return (
      <div className="space-y-6 px-4 py-6">
        {/* Page header */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>

        {/* Approval banner placeholder */}
        <Skeleton className="mt-4 h-12 w-full" />

        {/* Admin selection section */}
        <div className="mt-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <Skeleton className="mb-4 h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mt-4 h-10 w-full bg-red-400 dark:bg-red-600" />
          </div>
        </div>

        {/* Expert table section */}
        <div className="mt-10 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>

        {/* Project details section */}
        <div className="mt-10 space-y-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  if (error)
    return (
      <div>
        {t("error")}: {error.message}
      </div>
    );
  if (!data) return <div>{t("noData")}</div>;
  const projectClientInfoData: ProjectClientInfoDataType = {
    clientId: data.clientInfo?.client_id || "",
  };
  // Creating data to pass to the different tabs
  const projectInfoData: ProjectInfoDataType = {
    pid: data.projectInfo?.pid || "",
    name: data.projectInfo?.name || "",
    project_target_country: Array.isArray(
      data.projectInfo?.project_target_country,
    )
      ? data.projectInfo.project_target_country[0]?.project_country || []
      : [],
    description: data.projectInfo?.description || "",
    hub_type: {
      name: data.projectInfo?.hub_type.name || "",
    },
    industry: data.projectInfo?.project_target_info[0]?.industry_target || [],
    deadline: data.projectInfo?.deadline || new Date(),
    status: data.projectInfo?.status || "",
  };

  const targetInfoData: TargetExpertDataType = {
    expert_target_country: Array.isArray(
      data.projectInfo?.project_target_country,
    )
      ? data.projectInfo.project_target_country[0]?.expert_country || []
      : [],
    company_target: Array.isArray(
      data.targetExpertInfo?.project_target_info[0]?.company_target,
    )
      ? data.targetExpertInfo.project_target_info[0].company_target
          .filter((c) => c?.name !== null)
          .map((c) => c.name)
      : [],
    communication_language: Array.isArray(
      data.targetExpertInfo?.project_target_info[0]?.communication_language,
    )
      ? data.targetExpertInfo?.project_target_info[0]?.communication_language
      : [],
    keyword: {}, // TODO: Add this

    expertise: Array.isArray(
      data.targetExpertInfo?.project_target_info?.[0]?.expertise,
    )
      ? data.targetExpertInfo.project_target_info[0].expertise
      : [],

    profile: Array.isArray(
      data.targetExpertInfo?.project_target_info?.[0]?.profile,
    )
      ? data.targetExpertInfo.project_target_info[0].profile
      : [],
  };

  const expertQuestionsData: QuestionInfoDataType = {
    question: data.questionInfo?.questions || [],
  };

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{projectInfoData.name}</h1>
          <div className="flex flex-row items-center gap-2">
            <ProjectStatusBadge
              status={projectInfoData.status ?? "undefined"}
              database="project"
            />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t("openMenu")}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isApproved && (
              <DropdownMenuItem
                onClick={() => approveProject({ pid: projectId })}
              >
                <Check className="mr-1 h-4 w-4" />
                {t("approve")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => rejectProject({ pid: projectId })}>
              <X className="mr-1 h-4 w-4" />
              {t("reject")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => removeProject({ pid: projectId })}>
              <Trash className="mr-1 h-4 w-4" />
              {t("remove")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => closeProject({ pid: projectId })}>
              <X className="mr-1 h-4 w-4" />
              {t("close")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-4">
        {!isApproved && (
          <ApprovalBanner projectId={projectId} refetch={refetch} />
        )}
      </div>
      {isApproved && isInAdminOrg === false && (
        <div className="mt-4">
          <div className="mt-4">
            <div className="mt-6">
              <h2 className="text-md font-semibold">{t("chooseAdmin")}</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Card className="mt-2 py-2">
                <CardContent className="space-y-6">
                  {/* Admin */}
                  <div className="space-y-2">
                    <Label>{t("adminLabel")}</Label>
                    {data.projectUsers.length === 0 || isEditing ? (
                      <Controller
                        name="admin"
                        control={control}
                        render={({
                          field,
                        }: {
                          field: {
                            value: string[];
                            onChange: (value: string[]) => void;
                          };
                        }) => (
                          <MultiSelector
                            values={field.value}
                            onValuesChange={field.onChange}
                            className="w-full"
                          >
                            <MultiSelectorTrigger>
                              <MultiSelectorInput
                                placeholder={t("selectAdmin")}
                              />
                            </MultiSelectorTrigger>
                            <MultiSelectorContent>
                              <MultiSelectorList>
                                {data.admins.map((admin) => (
                                  <MultiSelectorItem
                                    key={admin.id}
                                    value={
                                      admin.emailAddresses[0]?.emailAddress ??
                                      ""
                                    }
                                  >
                                    {admin.emailAddresses[0]?.emailAddress}
                                  </MultiSelectorItem>
                                ))}
                              </MultiSelectorList>
                            </MultiSelectorContent>
                          </MultiSelector>
                        )}
                      />
                    ) : (
                      <div className="mt-4 text-sm font-semibold">
                        <InputBadgeTextBox
                          data={
                            data.projectUsers?.map((user) => user.email) ?? []
                          }
                        />
                      </div>
                    )}
                    {errors.admin && (
                      <p className="text-sm text-red-500">
                        {errors.admin.message as string}
                      </p>
                    )}
                  </div>
                  {(isEditing || (data.projectUsers?.length ?? 0) === 0) && (
                    <Button
                      type="submit"
                      className="w-full bg-red-500 text-white hover:bg-red-600"
                    >
                      {t("confirmButton")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </form>
            {!isEditing && (data.projectUsers?.length ?? 0) > 0 && (
              <Button
                type="button"
                className="mt-2 w-full bg-red-500 text-white hover:bg-red-600"
                onClick={() => handleEditClick()}
              >
                {t("edit")}
              </Button>
            )}
          </div>
        </div>
      )}

      {isApproved && (
        <div className="mt-4">
          <div className="mt-4">
            <div className="mt-6">
              <h2 className="text-md font-semibold">{t("projectExperts")}</h2>
            </div>
            <Card className="mt-2 py-2">
              <CardContent className="px-4 py-2">
                <DataTable
                  columns={columns}
                  data={data.expertInfo}
                  filterFn={searchFilterFn}
                  projectName={data.projectInfo?.name || ""}
                  projectDescription={data.projectInfo?.description || ""}
                  hubType={data.projectInfo?.hub_type.name || ""}
                  deadline={
                    typeof data.projectInfo?.deadline === "string"
                      ? data.projectInfo.deadline
                      : data.projectInfo?.deadline?.toISOString() || ""
                  }
                  projectId={projectId}
                  targetInfoData={targetInfoData}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <ProjectDetails
        projectClientInfoData={projectClientInfoData}
        projectInfoData={projectInfoData}
        targetInfoData={targetInfoData}
        expertQuestionsData={expertQuestionsData}
      />
    </>
  );
}

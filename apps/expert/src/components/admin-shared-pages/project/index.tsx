"use client";

import { useTranslations } from "next-intl";

import { Loading } from "@adh/ui/custom/Loading";
import { Skeleton } from "@adh/ui/ui/skeleton";

import { DataTable } from "~/components/ProjectDataTable";
import { api } from "~/trpc/react";
import { getColumns, searchFilterFn } from "./columns";

interface AdminProjectsPageProps {
  isSuperAdmin: boolean;
}

export default function AdminProjectsPage({
  isSuperAdmin,
}: AdminProjectsPageProps) {
  const t = useTranslations("project");
  const columns = getColumns(isSuperAdmin);
  const { data: isInAdminOrg } = api.admin.account.isUserInAdminOrg.useQuery();
  const { data, isLoading, error } = api.admin.project.getProjects.useQuery({
    isInAdminOrg: isInAdminOrg ?? false,
  });

  if (isLoading) {
    return (
      <div className="mt-4 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
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

  const handleClickProjectInfo = (index: number) => {
    const project = data[index];
    console.log(project);
    // TODO: bug fix when click dropdown options on the project, this is getting invoked

    // if (project) {
    //   routerPush(
    //     router,
    //     `/${isSuperAdmin ? "superadmin" : "admin"}/projects/${project.pid}`,
    //   );
    // }
  };

  return (
    <>
      <div className="mt-4">
        <h1 className="text-2xl font-bold">{t("manageTitle")}</h1>
        <p className="text-white-200">
          <p>{t("totalProjects", { count: data.length })}</p>
        </p>
      </div>

      <div className="mt-4">
        <div className="mt-4">
          <DataTable
            columns={columns}
            data={data}
            onClickFunction={(index) => handleClickProjectInfo(index)}
            filterFn={searchFilterFn}
          />
        </div>
      </div>
    </>
  );
}

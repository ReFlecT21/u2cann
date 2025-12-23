"use client";

import { Loading } from "@adh/ui/custom/Loading";

import { DataTable } from "~/components/ProjectDataTable";
import { api } from "~/trpc/react";
import { getColumns, searchFilterFn } from "./columns";
import { useTranslations } from "next-intl";

interface AdminExpertsPageProps {
  isSuperAdmin: boolean;
}

export default function AdminUExpertsPage({
  isSuperAdmin,
}: AdminExpertsPageProps) {
  const t = useTranslations("userClients");
  const columns = getColumns(isSuperAdmin);
  const { data: isInAdminOrg } = api.admin.account.isUserInAdminOrg.useQuery();

  const { data, isLoading, error } = api.admin.client.getClients.useQuery({
    isInAdminOrg: isInAdminOrg ?? false,
  });

  if (isLoading) return <Loading className="font-semibold" />;
  if (error) return <div>{t("error")}: {error.message}</div>;
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
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="text-white-200">
        {t("pageSubtitle", { count: data.length })}
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

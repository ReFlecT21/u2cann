"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Loading } from "@adh/ui/custom/Loading";
import { Button } from "@adh/ui/ui/button";

import { DataTable } from "~/components/ProjectDataTableExpertList";
import { api } from "~/trpc/react";
import { getColumns, searchFilterFn } from "./columns";

interface AdminExpertsPageProps {
  isSuperAdmin: boolean;
}

export default function AdminUExpertsPage({
  isSuperAdmin,
}: AdminExpertsPageProps) {
  const t = useTranslations("userExperts");
  const columns = getColumns(isSuperAdmin);
  const { data: isInAdminOrg } = api.admin.account.isUserInAdminOrg.useQuery();
  const { data, isLoading, error } = api.admin.expert.getExperts.useQuery({
    isInAdminOrg: isInAdminOrg ?? false,
  });

  if (isLoading) return <Loading className="font-semibold" />;
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
      {/* <div className="mt-4">
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="text-white-200">
        {t("pageSubtitle", { count: data.length })}
        </p>
      </div> */}
      <div className="mt-4 flex flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-white-200">
            {t("pageSubtitle", { count: data.length })}
          </p>
        </div>
        <Link href="users-experts/import">
          <Button className="space-x-2 bg-red-500 text-white hover:bg-red-600">
            <Plus className="text-white" size={20} />
            <p>{t("importExperts")}</p>
          </Button>
        </Link>
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

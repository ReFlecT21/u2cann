"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@adh/ui/ui/badge";
import { Button } from "@adh/ui/ui/button";
import { Card, CardHeader, CardTitle } from "@adh/ui/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@adh/ui/ui/table";

import { routerPush } from "~/utils/router";
import AdminStatusBadge from "./AdminStatusBadge";
import { useTranslations } from "next-intl";

interface DashboardHubCardProps {
  projects: {
    hubId: number;
    hubName: string;
    count: number;
  }[];
  title: string;
  link: string;
  database?: "project" | "projectExpert" | "invoice" | "contract";
}

const DashboardHubCard: React.FC<DashboardHubCardProps> = ({
  projects,
  title,
  link,
  database = "project",
}) => {
  const router = useRouter();
  const t = useTranslations("adminDashboardHubCard");

  const handleClickProjectInfo = (pid: string) => {
    if (pid) {
      routerPush(router, `${link}/${pid}`);
    }
  };
  return (
    <>
      <Card className="col-span-2 mt-3 p-4">
        <CardHeader className="flex flex-row items-center justify-between p-0">
          <CardTitle className="text-md font-semibold">{title}</CardTitle>
          <Link href={link}>
            <Button
              className="m-0 p-2 text-red-500 hover:bg-slate-50 hover:text-red-500 dark:hover:bg-gray-900"
              variant="ghost"
            >
              	{t("viewAll")}
            </Button>
          </Link>
        </CardHeader>
        <hr />
        <Table>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.hubId}
                onClick={() => handleClickProjectInfo(project.hubName)}
                className="cursor-pointer"
              >
                <TableCell className="flex h-12 items-center justify-between">
                  <div className="flex flex-grow flex-row space-x-4">
                    <p className="text-sm font-medium">{project.hubName}</p>
                  </div>
                  <div className="flex flex-shrink-0 flex-row items-center space-x-2">
                    {project.count !== undefined && (
                      <Badge className="bg-slate-700 text-white hover:bg-slate-700">
                        {project.count}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
};

export default DashboardHubCard;

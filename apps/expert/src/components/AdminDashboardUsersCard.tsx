"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@adh/ui/ui/badge";
import { Button } from "@adh/ui/ui/button";
import { Card, CardHeader, CardTitle } from "@adh/ui/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@adh/ui/ui/table";
import { useTranslations } from "next-intl";

import { routerPush } from "~/utils/router";

interface DashboardUsersCardProps {
  users: {
    id: string;
    name: string;
    email: string;
    profileImage: string;
  }[];
  title: string;
  link: string;
  database?: "project" | "projectExpert" | "invoice" | "contract";
}

const DashboardUsersCard: React.FC<DashboardUsersCardProps> = ({
  users,
  title,
  link,
  database = "project",
}) => {
  const router = useRouter();
  const t = useTranslations("adminDashboardUsersCard");

  const handleClickUserInfo = (id: string) => {
    if (id) {
      routerPush(router, `/admin/users-clients/${id}`);
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
            {users.map((user) => (
              <TableRow
                key={user.email}
                onClick={() => handleClickUserInfo(user.id)}
                className="cursor-pointer"
              >
                <TableCell className="flex h-12 items-center justify-between">
                  <div className="flex flex-grow flex-row items-center space-x-4">
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
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

export default DashboardUsersCard;

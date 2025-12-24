"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@adh/ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adh/ui/ui/dropdown-menu";
import { useTranslations } from "next-intl";

export type Instructor = {
  id: string;
  name: string;
  userId: string | null;
  branchId: string;
  specialty: string | null;
  bio: string | null;
  user: {
    name: string | null;
    email: string;
  } | null;
  branch: {
    id: string;
    name: string;
  };
};

export function getColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (instructor: Instructor) => void;
  onDelete: (id: string) => void;
}): ColumnDef<Instructor>[] {
  const t = useTranslations("instructorsPage");

  return [
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "user.email",
      header: t("email"),
      cell: ({ row }) => row.original.user?.email || "—",
    },
    {
      accessorKey: "branch.name",
      header: t("branch"),
      cell: ({ row }) => row.original.branch.name,
    },
    {
      accessorKey: "specialty",
      header: t("specialty"),
      cell: ({ row }) => row.original.specialty || "—",
    },
    {
      accessorKey: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(id)}
                className="text-red-600"
              >
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

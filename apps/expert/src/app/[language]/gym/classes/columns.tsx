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
import { Badge } from "@adh/ui/ui/badge";

export type ClassType = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  duration: number;
  defaultCapacity: number;
  isOpenGym: boolean;
  color: string | null;
};

export function getColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (classType: ClassType) => void;
  onDelete: (id: string) => void;
}): ColumnDef<ClassType>[] {
  const t = useTranslations("classTypesPage");

  return [
    {
      accessorKey: "displayName",
      header: t("displayName"),
      cell: ({ row }) => {
        const color = row.original.color;
        return (
          <div className="flex items-center gap-2">
            {color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            <span className="font-medium">{row.original.displayName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "duration",
      header: t("duration"),
      cell: ({ row }) => `${row.original.duration} min`,
    },
    {
      accessorKey: "defaultCapacity",
      header: t("defaultCapacity"),
      cell: ({ row }) => row.original.defaultCapacity,
    },
    {
      accessorKey: "isOpenGym",
      header: t("isOpenGym"),
      cell: ({ row }) =>
        row.original.isOpenGym ? (
          <Badge variant="secondary">Open Gym</Badge>
        ) : null,
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

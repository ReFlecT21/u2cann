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

// Define the clinician type to match the required columns
export type clinician = {
  id: string;
  user: { name: string };
  branch: { name: string };
  appointmentTypes: { name: string }[];
  species: { name: string }[];
};

export function getColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (clinician: clinician) => void;
  onDelete: (id: string) => void;
}): ColumnDef<clinician>[] {
  const t = useTranslations("cliniciansPage");

  return [
    {
      accessorKey: "user",
      header: t("nameDisplayed"),
      cell: ({ row }) => {
        const user = row.original.user;
        const branch = row.original.branch;
        return (
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={user.name}
              className="bg-white px-2 py-1 border rounded text-sm"
              disabled
            />
            <select
              className="bg-white px-2 py-1 border rounded text-sm text-muted-foreground"
              disabled
            >
              <option>{user.branchName}</option>
            </select>
          </div>
        );
      },
    },
    {
      accessorKey: "appointmentTypes",
      header: t("excludedAppointmentTypes"),
      cell: ({ row }) => {
        const types = row.original.appointmentTypes ?? [];
        return <div>{types.map((t) => t.name).join(", ") || t("none")}</div>;
      },
    },
    {
      accessorKey: "species",
      header: t("excludedSpecies"),
      cell: ({ row }) => {
        const species = row.original.species ?? [];
        return <div>{species.map((s) => s.name).join(", ") || t("none")}</div>;
      },
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

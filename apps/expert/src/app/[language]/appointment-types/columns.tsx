"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@adh/ui/ui/button";
import { useTranslations } from "next-intl";
import { appointmentType } from "~/types/appointmentType";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adh/ui/ui/dropdown-menu";

// Helper function to format appointment type names for display
const formatAppointmentTypeName = (name: string): string => {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function getColumns({
  onDelete,
  onEdit,
}: {
  onDelete: (id: string) => void;
  onEdit: (item: appointmentType) => void;
}): ColumnDef<appointmentType>[] {
  const t = useTranslations("appointmentTypesPage");

  return [
    {
      accessorKey: "name",
      header: t("displayName"),
      cell: ({ row }) => formatAppointmentTypeName(row.getValue("name") as string),
    },
    {
      accessorKey: "duration",
      header: t("duration"),
      cell: ({ row }) => `${row.getValue("duration")} min`,
    },
    {
      accessorKey: "maxAppointmentsPerClinician",
      header: t("maxAppointmentCount"),
      cell: ({ row }) => row.getValue("maxAppointmentsPerClinician") ?? "-",
    },
    {
      accessorKey: "gapToEarliestSlotMinutes",
      header: t("gapToEarliestSlot"),
      cell: ({ row }) => {
        const value = row.getValue("gapToEarliestSlotMinutes") as number;
        if (!value) return "-";
        return value >= 60 ? `${value / 60} Hours` : `${value} Minutes`;
      },
    },
    {
      accessorKey: "description",
      header: t("messageToInclude"),
      cell: ({ row }) => {
        const value = row.getValue("description") as string;
        return (
          <div className="max-w-[300px] truncate" title={value}>
            {value}
          </div>
        );
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

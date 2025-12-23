"use client";

import Link from "next/link";
import { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Eye,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@adh/ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adh/ui/ui/dropdown-menu";
import { useTranslations } from "next-intl";

import { Client } from "~/types/client";

export const searchFilterFn: FilterFn<Client> = (
  row: Row<Client>,
  columnId: string,
  filterValue: string,
): boolean => {
  const cellValue = row.getValue(columnId);
  const statusMapping: Record<string, string> = {
    applied: "Applied",
    declined: "Invitation Rejected",
    rejected: "Rejected",
    accepted: "Invitation Accepted",
    awarded: "Awarded",
    signed: "Contract Signed",
    payment: "Pending Payment",
    paid: "Paid",
  };
  // Check if the current column is 'status' and apply the status mapping
  if (columnId === "status") {
    const cellValue: string = row.getValue(columnId);
    const mappedValue: string = statusMapping[cellValue] || cellValue;

    return String(mappedValue)
      .toLowerCase()
      .includes(filterValue.toLowerCase());
  }

  return String(cellValue)
    .toLowerCase()
    .includes(String(filterValue).toLowerCase());
};

export function getColumns(isSuperAdmin: boolean) {
  const t = useTranslations("userClients");
  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: t("name"),
    },
    {
      accessorKey: "email",
      header: t("email"),
    },
    {
      accessorKey: "phone",
      header: t("phone"),
    },
    {
      accessorKey: "lastLogin",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("lastLogin")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "registeredAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("registeredAt")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },

    {
      accessorKey: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const expertId = row.original.id;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/${isSuperAdmin ? "superadmin" : "admin"}/users-clients/${expertId}`}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  {t("view")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  return columns;
}

// This type is used to define the shape of our data.

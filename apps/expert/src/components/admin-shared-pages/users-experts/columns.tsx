"use client";

import Link from "next/link";
import { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import { ArrowUpDown, Check, Eye, MoreHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@adh/ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adh/ui/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@adh/ui/ui/tooltip";

import { Expert } from "~/types/expert";

export const searchFilterFn: FilterFn<Expert> = (
  row: Row<Expert>,
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
  const t = useTranslations("userExperts");
  const columns: ColumnDef<Expert>[] = [
    {
      accessorKey: "registered",
      header: t("registered"),
      cell: ({ row }) => {
        const isRegistered = row.getValue("registered") as boolean;
        return (
          <div className="flex items-center justify-center">
            {isRegistered ? (
              <Check className="text-green-500" size={18} />
            ) : (
              <X className="text-red-500" size={18} />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: t("name"),
      meta: { isExportOnly: true, notShown: false },
    },
    {
      accessorKey: "linkedIn",
      header: t("linkedin"),
      meta: { isExportOnly: true, notShown: false },
    },
    {
      accessorKey: "company",
      header: t("company"),
      meta: { isExportOnly: true, notShown: true },
    },
    {
      accessorKey: "position",
      header: t("position"),
      meta: { isExportOnly: true, notShown: true },
    },
    {
      accessorKey: "phone",
      header: t("phone"),
      meta: { isExportOnly: false, notShown: false },
    },
    {
      accessorKey: "companyAbout",
      header: t("companyAbout"),
      meta: { isExportOnly: true, notShown: true },
    },
    {
      accessorKey: "industry",
      header: t("industry"),
      cell: ({ row }) => {
        const value = row.getValue("industry") as string;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="max-w-[150px] truncate"
              >
                View
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-pre-wrap">
              {value}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: "skills",
      header: t("skills"),
      cell: ({ row }) => {
        const value = row.getValue("skills") as string;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="max-w-[150px] truncate"
              >
                View
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-pre-wrap">
              {value}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: "about",
      header: t("about"),
      cell: ({ row }) => {
        const value = row.getValue("about") as string;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="max-w-[150px] truncate"
              >
                View
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-pre-wrap">
              {value}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: "experiences",
      header: t("experiences"),
      meta: { isExportOnly: true, notShown: false },
      cell: ({ row }) => {
        const value = row.getValue("experiences") as string;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="max-w-[150px] truncate"
              >
                View
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-pre-wrap">
              {value}
            </TooltipContent>
          </Tooltip>
        );
      },
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
      accessorKey: "registeredBy",
      header: t("registeredBy"),
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
                  href={`/${isSuperAdmin ? "superadmin" : "admin"}/users-experts/${expertId}`}
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

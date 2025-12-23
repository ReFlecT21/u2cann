"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl"; 
import { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Check,
  Edit,
  Eye,
  MoreHorizontal,
  Trash,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@adh/ui/custom/ConfirmDialog";
import { Button } from "@adh/ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adh/ui/ui/dropdown-menu";

import ProjectStatusBadge from "~/components/ProjectStatusBadge";
import { api } from "~/trpc/react";
import { Project } from "~/types/projects";

export const searchFilterFn: FilterFn<Project> = (
  row: Row<Project>,
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
  const t = useTranslations("project");

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("projectStatus")}
          <ArrowUpDown className="ml-2 h-4" />
        </Button>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return <ProjectStatusBadge status={value} database="project" />;
      },
    },
    {
      accessorKey: "project",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("projectName")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "hubType",
      header: t("hubType"),
    },
    {
      accessorKey: "initiateDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("initiateDate")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "deadline",
      header: t("deadlineDate"),
    },
    {
      accessorKey: "client",
      header: t("client"),
    },
    {
      accessorKey: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const pid = row.original.pid;
        const { mutateAsync: deleteProject } =
          api.admin.project.delete.useMutation({
            onSuccess: (data) => {
              toast.success(t("deleteSuccess", { name: data.name }));
              window.location.reload();
            },
          });
        const handleDelete = async () => {
          await deleteProject({ pid });
        };

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [confirmOpen, setConfirmOpen] = useState(false);

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
                  href={`/${isSuperAdmin ? "superadmin" : "admin"}/projects/${pid}`}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  {t("view")}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmOpen(true);
                }}
              >
                <Trash className="mr-1 h-4 w-4" />
                {t("remove")}
              </DropdownMenuItem>
              <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                confirmButton={{
                  action: handleDelete,
                  children: t("delete"),
                  buttonProps: { variant: "destructive", size: "sm" },
                }}
                dialogTitle={t("confirmDelete")}
                dialogDescription={t("confirmDeleteDesc")}
                cancelButton={{
                  children: t("cancel"),
                  buttonProps: { variant: "outline", size: "sm" },
                }}
                challengeText={row.original.pid}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  return columns;
}

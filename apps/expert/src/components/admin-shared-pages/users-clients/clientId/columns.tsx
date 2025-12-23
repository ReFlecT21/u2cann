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

import ProjectStatusBadge from "~/components/ProjectStatusBadge";
import { ExpertProject } from "~/types/projects";

export const searchFilterFn: FilterFn<ExpertProject> = (
  row: Row<ExpertProject>,
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

export function getColumns(
  isSuperAdmin: boolean,
  type: "ongoing" | "completed",
) {
  const commonColumns: ColumnDef<ExpertProject>[] = [
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4" />
          </Button>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return <ProjectStatusBadge status={value} database="project" />;
      },
    },
    {
      accessorKey: "projectId",
      header: "Project ID",
    },
    {
      accessorKey: "projectName",
      header: "Project Name",
    },
    {
      accessorKey: "adhPic",
      header: "ADH PIC",
          cell: ({ getValue }) => {
        const projectUsers = getValue() as { user_id: string }[] | undefined;
      
        // Ensure projectUsers is an array before calling .map()
        return Array.isArray(projectUsers) && projectUsers.length > 0
          ? projectUsers.map((user) => user.user_id).join(", ")
          : "";
      },
    },
  ];

  const ongoingColumns: ColumnDef<ExpertProject>[] = [
    ...commonColumns,
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const expertId = row.original.projectId;    
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/${isSuperAdmin ? "superadmin" : "admin"}/projects/${expertId}`}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
           
             
             
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const completedColumns: ColumnDef<ExpertProject>[] = [
    ...commonColumns,
    {
      accessorKey: "completionDate",
      header: "Completion Date",
    },
  ];

  return type === "ongoing" ? ongoingColumns : completedColumns;
}

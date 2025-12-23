"use client";

import * as React from "react";
import { useState } from "react";
import { useUser } from "@clerk/nextjs"; // Add this import

import {
  ColumnDef,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Table,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Copy,
  Download,
  Eye,
  Mail,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { InviteDialog } from "@adh/ui/custom/InviteDialog";
import { Button } from "@adh/ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adh/ui/ui/dropdown-menu";
import { Input } from "@adh/ui/ui/input";
import {
  TableBody,
  TableCell,
  Table as TableComponent,
  TableHead,
  TableHeader,
  TableRow,
} from "@adh/ui/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@adh/ui/ui/tooltip";

// Import Tooltip components
import { api } from "~/trpc/react";
import exportToExcel from "./ExportTableExpert";
import ProjectAddExpertDialog from "./ProjectAddExpertDialog";
import { TargetExpertDataType } from "./ProjectDetails";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onClickFunction?: (index: number) => void;
  filterFn?: FilterFn<TData>;
  projectName: string;
  projectId: string;
  projectDescription: string;
  hubType: string;
  deadline: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onClickFunction,
  filterFn,
  projectName,
  projectDescription,
  hubType,
  deadline,
  projectId,
  targetInfoData,
}: DataTableProps<TData, TValue> & { targetInfoData: TargetExpertDataType }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0, //initial page index
    pageSize: 10, //default page size
  });
  const pageSizes = [10, 20, 30];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: filterFn || "includesString",
    state: {
      globalFilter,
      pagination,
    },
  }); // Pagination Values
  const filteredRows = table.getFilteredRowModel().rows;
  const totalRows = filteredRows.length;
  const currentMin =
    table.getState().pagination.pageIndex *
      table.getState().pagination.pageSize +
    1;
  const currentMax = Math.min(
    (table.getState().pagination.pageIndex + 1) *
      table.getState().pagination.pageSize,
    totalRows,
  );
  const { mutateAsync } =
    api.admin.email.sendUnregisteredProjectInviteEmail.useMutation();

  const { user } = useUser(); // Add this line to get the current user
  const handleButtonClick = async () => {
    setDialogOpen(true);
    console.log("Button clicked!");
  };
  // Fetch the referral code using the trpc query
  const { data: referralCodeData } =
    api.admin.referer.getReferalCode.useQuery();
  const handleSendInvitation = async (emails: string, message: string) => {
    // Use the referral code from the query
    const referralCode = referralCodeData?.referer_code;

    if (!referralCode) {
      console.error("Referral code not found");
      return;
    }
    await mutateAsync({
      to: emails,
      subject: `Invited to ${projectName}`,
      message: message,
      projectName: projectName,
      projectLink: `https://app.asiadealhub.com/?ref=${referralCode}&pid=${projectId}`,
    });
    console.log("Sending invitation to:", emails);

    // You can replace this with your email sending function (e.g., `mutateAsync`)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setDialogOpen(false); // Close the dialog after sending
  };
  const handleCopyReferralLink = async () => {
    const referralCode = referralCodeData?.referer_code;
    if (!referralCode) {
      console.error("Referral code not found");
      return;
    }
    const refererLink = `https://app.asiadealhub.com/?ref=${referralCode}&pid=${projectId}`;
    await navigator.clipboard.writeText(refererLink);
    toast.success("Referral link copied", {
      description: "Share this link with your referral.",
    });
    console.log("Referral link copied");
  };
  const [isDialogOpen, setDialogOpen] = useState(false);
  const t = useTranslations("projectExpertTable");
  return (
    <>
      <div className="flex justify-between">
        <div className="flex flex-row items-center">
          <Search className="mx-2" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={globalFilter ?? ""}
            onChange={(e) => {
              table.setGlobalFilter(String(e.target.value));
            }}
            className="max-w-sm"
          />
          {/* KS NEED TO MAKE SURE BUTTONS DO NOT LEAVE THE TABLE WHEN SCREEN IS RESIZED */}
          <TooltipProvider>
            <ProjectAddExpertDialog targetInfoData={targetInfoData}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mx-2">
                    <Button className="space-x-0 bg-red-500 text-white hover:bg-red-600">
                      <Plus className="text-white" size={20} />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("addExperts")}</p>
                </TooltipContent>
              </Tooltip>
            </ProjectAddExpertDialog>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mx-2">
                  <Button
                    className="space-x-0 bg-red-500 text-white hover:bg-red-600"
                    onClick={handleCopyReferralLink}
                  >
                    <Copy className="text-white" size={20} />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("copyReferral")}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mx-2">
                  <Button
                    className="space-x-0 bg-red-500 text-white hover:bg-red-600"
                    onClick={handleButtonClick}
                  >
                    <Mail className="text-white" size={20} />
                  </Button>
                  <InviteDialog
                    open={isDialogOpen}
                    onOpenChange={setDialogOpen}
                    onConfirm={handleSendInvitation}
                    name={user?.fullName || ""}
                    projectName={projectName}
                    projectDescription={projectDescription}
                    hubType={hubType}
                    deadline={deadline}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("inviteUnregistered")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Page Size */}
        <div className="flex justify-end space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings size={15} /> <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {pageSizes.map((size) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={size}
                    className="capitalize"
                    checked={pagination.pageSize === size}
                    onCheckedChange={() => table.setPageSize(size)}
                  >
                    {size}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Show/Hide Dropdown Columns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye size={15} /> <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    column.getCanHide() && !column.columnDef.meta?.isExportOnly,
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download size={15} /> <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() =>
                  exportToExcel(table as unknown as Table<object>, "table", t)
                }
              >
                {t("exportExcel")}
              </DropdownMenuItem>
              {/* <DropdownMenuItem
                onClick={() => exportToPdf(table as unknown as Table<object>)}
              >
                Export to PDF
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-md border">
        <TableComponent>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers
                  .filter((header) => !header.column.columnDef.meta?.notShown)
                  .map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{ textAlign: "center" }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-16 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
                  onClick={() => onClickFunction?.(row.index)}
                >
                  {row
                    .getVisibleCells()
                    .filter((cell) => !cell.column.columnDef.meta?.notShown)
                    .map((cell) => (
                      <TableCell key={cell.id} style={{ textAlign: "center" }}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableComponent>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-start space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("next")}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {t("showingRange", {
            min: currentMin,
            max: currentMax,
            total: totalRows,
          })}
        </div>
      </div>
    </>
  );
}

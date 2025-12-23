"use client";

import * as React from "react";
import { useState } from "react";
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
import { ChevronDown, Download, Eye, Search, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

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

import exportToExcel from "./ExportTableExpert";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onClickFunction?: (index: number) => void;
  filterFn?: FilterFn<TData>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onClickFunction,
  filterFn,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const t = useTranslations("projectCompanyTable");
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
  });

  // Pagination Values
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
                  exportToExcel(table as unknown as Table<object>, "table")
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
                        className={
                          (header.column.columnDef as any)?.meta?.headClassName
                        }
                        style={{
                          textAlign:
                            (header.column.columnDef as any)?.meta?.align ||
                            "center",
                        }}
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
                      <TableCell
                        key={cell.id}
                        className={
                          (cell.column.columnDef as any)?.meta?.cellClassName
                        }
                        style={{
                          textAlign:
                            (cell.column.columnDef as any)?.meta?.align ||
                            "center",
                        }}
                      >
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

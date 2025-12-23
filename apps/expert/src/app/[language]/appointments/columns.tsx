"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@adh/ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@adh/ui/ui/dropdown-menu";
import dayjs from "dayjs";

interface AppointmentActionsProps {
  appointment: any;
  onStatusChange: (
    id: string,
    status: "scheduled" | "cancelled" | "completed",
  ) => void;
  onDelete: (id: string) => void;
}

function AppointmentActions({
  appointment,
  onStatusChange,
  onDelete,
}: AppointmentActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onStatusChange(appointment.id, "scheduled")}
          disabled={appointment.status.toLowerCase() === "scheduled"}
        >
          Mark as Scheduled
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusChange(appointment.id, "completed")}
          disabled={appointment.status.toLowerCase() === "completed"}
        >
          Mark as Completed
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusChange(appointment.id, "cancelled")}
          disabled={appointment.status.toLowerCase() === "cancelled"}
        >
          Mark as Cancelled
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(appointment.id)}
          className="text-red-600"
        >
          Delete Appointment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getColumns(
  onStatusChange?: (
    id: string,
    status: "scheduled" | "cancelled" | "completed",
  ) => void,
  onDelete?: (id: string) => void,
  t?: any,
) {
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "time",
      header: t("Time"),
      cell: ({ row }) => {
        const appointmentTime = row.original.time;
        const formattedDate = dayjs(appointmentTime).format("MMM DD, YYYY");
        const formattedTime = dayjs(appointmentTime).format("h:mm A");

        return (
          <div className="space-y-1">
            <div className="flex items-center text-sm font-medium">
              <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
              {formattedDate}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              {formattedTime}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "client",
      header: t("Client"),
      cell: ({ row }) => {
        const client = row.original.client;
        return (
          <div>
            <div className="font-medium">{client.name}</div>
            <div className="text-muted-foreground text-sm">{client.email}</div>
            <div className="text-sm">{client.phone}</div>
            <div className="inline-block px-2 py-0.5 mt-1 text-xs font-semibold text-white bg-sky-600 rounded">
              Matched
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "patient",
      header: t("Patient"),
      cell: ({ row }) => {
        const patient = row.original.patient;
        return (
          <div>
            <div className="font-medium">{patient.name}</div>
            <div className="text-muted-foreground text-sm">{patient.type}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "appointmentType",
      header: t("Appointment"),
      cell: ({ row }) => {
        const getStatusColor = (status: string) => {
          const normalizedStatus = status.toLowerCase();
          switch (normalizedStatus) {
            case "scheduled":
              return "bg-blue-100 text-blue-800 border-blue-200";
            case "completed":
              return "bg-green-100 text-green-800 border-green-200";
            case "cancelled":
              return "bg-red-100 text-red-800 border-red-200";
            default:
              return "bg-gray-100 text-gray-800 border-gray-200";
          }
        };

        return (
          <div>
            <div>{row.original.appointmentType}</div>
            <div
              className={`inline-block px-2 py-0.5 mt-1 text-xs font-medium border rounded-full ${getStatusColor(row.original.status)}`}
            >
              {row.original.status}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "clinician",
      header: t("Clinician"),
      cell: ({ row }) => {
        const clinician = row.original.clinician;
        return (
          <div>
            <div className="font-medium">{clinician.name}</div>
            <div className="text-muted-foreground text-sm">
              {clinician.clinic}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "fee",
      header: t("Appointment Fee"),
      cell: ({ row }) => (
        <div>
          <div>${row.original.fee.toFixed(2)}</div>
          <div className="text-muted-foreground text-sm">
            {row.original.paymentStatus}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (!onStatusChange || !onDelete) return null;
        return (
          <AppointmentActions
            appointment={row.original}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        );
      },
    },
  ];

  return columns;
}

// Simple case-insensitive filter function for generic text columns
export const searchFilterFn = (
  row: any,
  columnId: string,
  filterValue: string,
) => {
  const value = row.getValue(columnId);
  return String(value).toLowerCase().includes(filterValue.toLowerCase());
};

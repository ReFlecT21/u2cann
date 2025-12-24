"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Button } from "@adh/ui/ui/button";
import { Badge } from "@adh/ui/ui/badge";
import { useTranslations } from "next-intl";

export type Booking = {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  confirmationCode: string;
  status: "confirmed" | "cancelled" | "no_show" | "completed";
  createdAt: Date;
  session: {
    startTime: Date;
    classType: {
      displayName: string;
      color: string | null;
    };
    instructor: {
      name: string;
    };
  };
};

export function getColumns({
  onCancel,
}: {
  onCancel: (id: string) => void;
}): ColumnDef<Booking>[] {
  const t = useTranslations("bookingsPage");

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      case "no_show":
        return "secondary";
      case "completed":
        return "outline";
      default:
        return "default";
    }
  };

  return [
    {
      accessorKey: "guestName",
      header: t("guestName"),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.guestName}</div>
      ),
    },
    {
      accessorKey: "guestEmail",
      header: t("guestEmail"),
      cell: ({ row }) => row.original.guestEmail,
    },
    {
      accessorKey: "session",
      header: t("session"),
      cell: ({ row }) => {
        const session = row.original.session;
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: session.classType.color || "#3B82F6" }}
            />
            <div>
              <div className="font-medium">{session.classType.displayName}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(session.startTime), "MMM d, h:mm a")}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "confirmationCode",
      header: t("confirmationCode"),
      cell: ({ row }) => (
        <code className="bg-muted px-2 py-1 rounded text-xs">
          {row.original.confirmationCode}
        </code>
      ),
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {t(`statuses.${row.original.status}`)}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: t("createdAt"),
      cell: ({ row }) =>
        format(new Date(row.original.createdAt), "MMM d, yyyy h:mm a"),
    },
    {
      accessorKey: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        if (row.original.status !== "confirmed") {
          return null;
        }
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(row.original.id)}
          >
            {t("cancel")}
          </Button>
        );
      },
    },
  ];
}

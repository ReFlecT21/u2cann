"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "~/components/ProjectDataTableExpertList";
import { api } from "~/trpc/react";
import { getColumns, type Booking } from "./columns";
import { Button } from "@adh/ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@adh/ui/ui/dialog";
import { toast } from "sonner";

export default function BookingsPage() {
  const t = useTranslations("bookingsPage");
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const ctx = api.useContext();

  const { data: bookings = [] } = api.gym.bookings.getAll.useQuery();

  const cancelBooking = api.gym.bookings.cancel.useMutation({
    onSuccess: () => {
      toast.success(`${t("toast.cancelled.title")}: ${t("toast.cancelled.description")}`);
      void ctx.gym.bookings.getAll.invalidate();
      void ctx.gym.sessions.getAll.invalidate();
      setCancellingBooking(null);
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  function onCancel(id: string) {
    const booking = bookings.find((b) => b.id === id) ?? null;
    setCancellingBooking(booking);
  }

  const columns = getColumns({ onCancel });

  return (
    <>
      <header className="mb-4">
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">
          {t("pageSubtitle", { count: bookings.length })}
        </p>
      </header>

      <div className="mt-4">
        <DataTable columns={columns} data={bookings} />
      </div>

      <Dialog
        open={!!cancellingBooking}
        onOpenChange={(isOpen) => !isOpen && setCancellingBooking(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmCancelTitle")}</DialogTitle>
          </DialogHeader>
          <p>
            {t("confirmCancelMessage", {
              name: cancellingBooking?.guestName || "Unknown",
            })}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancellingBooking(null)}>
              {t("close")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cancellingBooking) {
                  cancelBooking.mutate({ id: cancellingBooking.id });
                }
              }}
              disabled={cancelBooking.isPending}
            >
              {t("confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

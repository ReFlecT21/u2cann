"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { species } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Trash } from "lucide-react";
import { Button } from "@adh/ui/ui/button";
import { api } from "~/trpc/react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@adh/ui/ui/alert-dialog";

export function getColumns(): ColumnDef<species>[] {
  const t = useTranslations("speciesPage");
  const utils = api.useUtils();
  const hideSpecies = api.user.species.hideSpecies.useMutation({
    onSuccess: () => utils.user.species.getSpecies.invalidate(),
  });

  const [open, setOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (pendingDeleteId) {
      hideSpecies.mutate({ id: pendingDeleteId });
      setPendingDeleteId(null);
      setOpen(false);
    }
  };

  return [
    {
      accessorKey: "name",
      header: t("name"),
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const speciesId = row.original.id;
        return (
          <>
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => {
                    setPendingDeleteId(speciesId);
                    setOpen(true);
                  }}
                >
                  <Trash size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("confirmDeleteDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    {t("confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
      },
    },
  ];
}

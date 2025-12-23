"use client";

import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@adh/ui/ui/button";
import { Trash2 } from "lucide-react";
import { branch } from "@prisma/client";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@adh/ui/ui/dialog";
import { api } from "~/trpc/react";
import { toast } from "sonner";

export function getColumns(): ColumnDef<branch>[] {
  const t = useTranslations("branchesPage");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const utils = api.useUtils();
  const deleteMutation = api.user.branches.deleteBranch.useMutation({
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      utils.user.branches.getAllBranches.invalidate();
    },
    onError: () => {
      toast.error(t("deleteError"));
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
    setSelectedId(null);
  };

  return [
    {
      accessorKey: "name",
      header: t("name"),
    },
    {
      accessorKey: "location",
      header: t("location"),
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const branch = row.original;

        return (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedId(branch.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            {selectedId === branch.id && (
              <Dialog
                open={true}
                onOpenChange={(isOpen) => !isOpen && setSelectedId(null)}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("confirmDeleteTitle")}</DialogTitle>
                  </DialogHeader>
                  <p>{t("confirmDeleteMessage", { name: branch.name })}</p>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedId(null)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(branch.id)}
                    >
                      {t("confirm")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        );
      },
    },
  ];
}

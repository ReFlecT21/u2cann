import React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@adh/ui/ui/alert-dialog";
import { Button } from "@adh/ui/ui/button";

interface AccountCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountType: "individual" | "corporate";
  onConfirm: () => void;
}

export function AccountCreationDialog({
  open,
  onOpenChange,
  accountType,
  onConfirm,
}: AccountCreationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create a {accountType} Account</AlertDialogTitle>
          <AlertDialogDescription>
            You don’t have a {accountType} account yet. Would you like to create
            one now?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onConfirm}>Create {accountType} Account</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

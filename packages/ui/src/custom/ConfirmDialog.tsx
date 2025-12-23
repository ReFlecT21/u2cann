"use client";

import type { VariantProps } from "class-variance-authority";
import React, { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface ConfirmDialogProps {
  confirmButton: {
    action?: () => Promise<void>;
    children: string;
    buttonProps?: VariantProps<typeof buttonVariants>;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dialogTitle: string;
  dialogDescription?: string;
  cancelButton?: {
    action?: () => Promise<void>;
    children: React.ReactNode;
    buttonProps?: VariantProps<typeof buttonVariants>;
  };
  challengeText?: string;
}

export function ConfirmDialog({
  confirmButton,
  trigger,
  open,
  onOpenChange,
  dialogDescription,
  dialogTitle,
  cancelButton,
  challengeText,
}: ConfirmDialogProps) {
  const [challengeInput, setChallengeInput] = useState("");
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const handleOpenChange = isControlled ? onOpenChange : setInternalOpen;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && trigger}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          {challengeText && (
            <>
              <Label htmlFor="challengeInput">
                Please type &apos;{challengeText}&apos; to confirm.
              </Label>
              <Input
                id="challengeInput"
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value)}
              />
            </>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          {cancelButton ? (
            <AlertDialogCancel asChild>
              <Button
                variant={cancelButton.buttonProps?.variant}
                size={cancelButton.buttonProps?.size}
                onClick={() => {
                  if (!!cancelButton.action) {
                    cancelButton.action();
                  }
                  setChallengeInput("");
                }}
              >
                {cancelButton.children}
              </Button>
            </AlertDialogCancel>
          ) : (
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          )}
          <AlertDialogAction
            asChild
            className={buttonVariants(confirmButton.buttonProps)}
          >
            <Button
              onClick={() => {
                if (!!confirmButton.action) {
                  confirmButton.action();
                }
                setChallengeInput("");
              }}
              disabled={!!challengeText && challengeInput !== challengeText}
            >
              {confirmButton.children}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

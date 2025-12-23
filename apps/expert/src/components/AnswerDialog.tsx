"use client";

import type { VariantProps } from "class-variance-authority";
import React from "react";
import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@adh/ui/ui/alert-dialog";
import { Button, buttonVariants } from "@adh/ui/ui/button";

interface AnswerDialogProps {
  confirmButton: {
    action?: () => Promise<void>;
    children: string;
    buttonProps?: VariantProps<typeof buttonVariants>;
  };
  selectedOption: number;
  answerOption: number;
  answerDescription: string;
  explanation?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AnswerDialog({
  confirmButton,
  selectedOption,
  answerOption,
  answerDescription,
  isOpen,
  explanation,
  onClose,
}: AnswerDialogProps) {
  const t = useTranslations("answerDialog");

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {selectedOption === answerOption ? t("correct") : t("incorrect")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {selectedOption === answerOption ? (
              answerDescription
            ) : (
              <>
                <strong>{t("correctAnswer")}:</strong> {answerDescription}
              </>
            )}
            {explanation && (
              <div className="mt-2 text-sm text-muted-foreground">
                <strong>{t("explanation")}:</strong> {explanation}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            asChild
            className={buttonVariants(confirmButton.buttonProps)}
          >
            <Button>{confirmButton.children}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

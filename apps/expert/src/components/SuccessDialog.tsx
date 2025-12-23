import { CircleCheckBig } from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@adh/ui/ui/alert-dialog";

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export default function SuccessDialog({
  isOpen,
  onClose,
  title,
  description,
}: SuccessDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="flex items-center justify-center space-x-2 text-center">
        <CircleCheckBig size={45} />
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}

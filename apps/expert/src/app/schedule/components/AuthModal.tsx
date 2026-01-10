"use client";

import { SignIn } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@adh/ui/ui/dialog";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Sign in to book classes with your membership
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <SignIn
            routing="hash"
            afterSignInUrl="/schedule"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none",
                headerTitle: "text-xl",
                headerSubtitle: "text-gray-500",
              },
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

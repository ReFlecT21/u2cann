"use client";

import { useClerk } from "@clerk/nextjs";

import { Button } from "@adh/ui/ui/button";

export function SignOutButton() {
  const { signOut } = useClerk();
  return (
    <Button
      variant="destructiveOutline"
      className="mb-2 w-full"
      onClick={() => signOut()}
    >
      Sign out
    </Button>
  );
}

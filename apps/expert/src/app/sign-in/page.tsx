"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

export default function CustomSignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect_url") || "/";

  // Use Clerk's prebuilt for auth UX; we'll still run post-login merge via a callback route
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{ variables: { colorPrimary: "#ef4444" } }}
          afterSignInUrl={redirectTo}
          afterSignUpUrl={redirectTo}
        />
      </div>
    </div>
  );
}

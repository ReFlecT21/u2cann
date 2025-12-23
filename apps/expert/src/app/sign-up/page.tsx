"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function SignUpPage() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams(); // Get query params
  const referralCode = searchParams.get("ref");
  useEffect(() => {
    if (referralCode) {
      console.log("Referral Code:", referralCode);
      localStorage.setItem("referralCode", referralCode);
    }
  }, [referralCode]);
  return (
    <div className="flex h-dvh w-screen items-center justify-center">
      <SignUp
        routing="hash"
        appearance={{
          baseTheme: resolvedTheme === "dark" ? dark : undefined,
        }}
      />
    </div>
  );
}

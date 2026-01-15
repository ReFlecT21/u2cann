"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // Sign-ups are disabled - redirect to sign-in
    router.replace("/sign-in");
  }, [router]);

  return null;
}

"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const { resolvedTheme } = useTheme();
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // If already signed in, redirect to role-based page
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/redirect");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Boxing Gym
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>
        <SignIn
          routing="hash"
          appearance={{
            baseTheme: resolvedTheme === "dark" ? dark : undefined,
            elements: {
              rootBox: "w-full",
              card: "shadow-lg",
            },
          }}
          forceRedirectUrl="/redirect"
        />
      </div>
    </div>
  );
}

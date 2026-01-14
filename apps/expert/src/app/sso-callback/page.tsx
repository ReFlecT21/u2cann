"use client";

import { useEffect } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Try sign-in first
        if (signIn) {
          const result = await signIn.handleRedirectCallback();
          if (result.status === "complete") {
            await setSignInActive({ session: result.createdSessionId });
            router.push("/redirect");
            return;
          }
        }

        // Try sign-up if sign-in didn't work
        if (signUp) {
          const result = await signUp.handleRedirectCallback();
          if (result.status === "complete") {
            await setSignUpActive({ session: result.createdSessionId });
            router.push("/redirect");
            return;
          }
        }
      } catch (err) {
        console.error("SSO callback error:", err);
        router.push("/sign-in?error=sso_failed");
      }
    }

    handleCallback();
  }, [signIn, signUp, setSignInActive, setSignUpActive, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto" />
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

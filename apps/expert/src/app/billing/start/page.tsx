"use client";

import { useState, Suspense } from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@adh/ui/ui/button";
import { Input } from "@adh/ui/ui/input";
import { Loader2, Mail, ArrowRight, ArrowLeft } from "lucide-react";

/**
 * Account-first entry point for the billing links.
 *
 * /billing/start?tier=student_98[&mode=prorate]
 *
 * 1. Member enters their email; we ensure an account exists (server-side).
 * 2. They verify a 6-digit OTP sent to that email — proving the address is
 *    real and typo-free.
 * 3. Signed in, we forward them to /api/billing/checkout, which locks the
 *    checkout to their verified account email.
 */
function BillingStart() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useUser();
  const params = useSearchParams();
  const tier = params.get("tier") ?? "";
  const mode = params.get("mode");

  const checkoutUrl = `/api/billing/checkout?${new URLSearchParams({
    ...(tier ? { tier } : {}),
    ...(mode ? { mode } : {}),
  }).toString()}`;

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);

  // Already signed in? Straight to payment.
  if (isSignedIn) {
    if (typeof window !== "undefined") window.location.replace(checkoutUrl);
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setIsLoading(true);
    setError("");
    try {
      // Ensure the account exists (new members get one created server-side).
      const prep = await fetch("/api/billing/begin-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!prep.ok) {
        const body = (await prep.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Could not prepare sign-in");
      }

      const result = await signIn.create({ identifier: email.trim().toLowerCase() });
      const emailCodeFactor = result.supportedFirstFactors?.find(
        (factor) => factor.strategy === "email_code",
      );
      if (emailCodeFactor && "emailAddressId" in emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailCodeFactor.emailAddressId,
        });
        setPendingVerification(true);
      } else {
        setError("Email sign-in is not available. Please contact the gym.");
      }
    } catch (err) {
      const message =
        (err as { errors?: { message?: string }[] }).errors?.[0]?.message ??
        (err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        window.location.replace(checkoutUrl);
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err) {
      const message =
        (err as { errors?: { message?: string }[] }).errors?.[0]?.message ??
        "Invalid code. Please try again.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-gray-900 dark:bg-gray-950 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="U2Can Boxing"
            width={80}
            height={80}
            className="rounded-full shadow-lg mb-4"
            priority
          />
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tight">
            JOIN U2CAN BOXING
          </h1>
          <p className="mt-2 text-gray-400">
            Verify your email, then complete your membership payment
          </p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-muted/50">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            {!pendingVerification ? (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 h-12 text-base"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your membership and receipts will be tied to this email.
                  </p>
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white font-semibold text-base"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Continue to payment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-foreground">Check your email</h2>
                  <p className="mt-2 text-muted-foreground">
                    We sent a verification code to
                    <br />
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Can&apos;t find it? Check your spam or junk folder.
                  </p>
                </div>

                <form onSubmit={handleCodeSubmit} className="space-y-6">
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="h-12 text-center text-xl tracking-widest font-mono"
                    maxLength={6}
                    required
                    disabled={isLoading}
                    autoFocus
                  />

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || code.length < 6}
                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white font-semibold text-base"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Verify & continue to payment"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPendingVerification(false);
                      setCode("");
                      setError("");
                    }}
                    disabled={isLoading}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Use a different email
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BillingStartPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <BillingStart />
    </Suspense>
  );
}

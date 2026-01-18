"use client";

import { useState, useEffect } from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@adh/ui/ui/button";
import { Input } from "@adh/ui/ui/input";
import { Loader2, Mail, ArrowRight, ArrowLeft } from "lucide-react";

export default function HomePage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const prefillEmail = params.get("email") || "";

  const [email, setEmail] = useState(prefillEmail);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);

  // If already signed in, redirect to role-based page
  useEffect(() => {
    if (isUserLoaded && isSignedIn) {
      router.push("/redirect");
    }
  }, [isUserLoaded, isSignedIn, router]);

  // Handle email submission - start OTP flow
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    setError("");

    try {
      // Start the sign-in process with email code
      const result = await signIn.create({
        identifier: email,
      });

      // Check if we need to verify with a code
      const emailCodeFactor = result.supportedFirstFactors?.find(
        (factor) => factor.strategy === "email_code"
      );

      if (emailCodeFactor && "emailAddressId" in emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailCodeFactor.emailAddressId,
        });
        setPendingVerification(true);
      } else {
        setError("Email sign-in is not available. Please try another method.");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError("Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/redirect");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError("Invalid code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setPendingVerification(false);
    setCode("");
    setError("");
  };

  // Show loading while checking auth state
  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  // Show redirecting if signed in
  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-foreground mx-auto" />
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - matching /schedule style */}
      <header className="bg-gray-900 dark:bg-gray-950 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/schedule" className="text-sm text-gray-400 hover:text-white transition-colors">
              View Schedule
            </Link>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image
              src="/logo.png"
              alt="U2Can Boxing"
              width={80}
              height={80}
              className="rounded-full shadow-lg mb-4"
              priority
            />
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tight">
              WELCOME BACK
            </h1>
            <p className="mt-2 text-gray-400">
              Sign in to book your classes
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-muted/50">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            {!pendingVerification ? (
              <>
                {/* Email Form */}
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
                        className="pl-10 h-12 text-base text-foreground bg-background border-input focus:border-ring focus:ring-ring"
                        required
                        disabled={isLoading}
                      />
                    </div>
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
                        Continue
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

              </>
            ) : (
              <>
                {/* OTP Verification */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-foreground">Check your email</h2>
                  <p className="mt-2 text-muted-foreground">
                    We sent a verification code to<br />
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleCodeSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
                      Verification code
                    </label>
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="h-12 text-center text-xl tracking-widest font-mono text-foreground bg-background border-input focus:border-ring focus:ring-ring"
                      maxLength={6}
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>

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
                      "Verify & Sign In"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
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

      {/* Footer - matching /schedule style */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            Sign in with your membership to book classes
          </p>
        </div>
      </footer>
    </div>
  );
}

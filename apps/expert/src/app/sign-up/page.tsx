"use client";

import { useState, useEffect } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@adh/ui/ui/button";
import { Input } from "@adh/ui/ui/input";
import { Loader2, Mail, User, ArrowRight, ArrowLeft } from "lucide-react";

export default function CustomSignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect_url") || "/redirect";
  const referralCode = params.get("ref");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);

  // Store referral code
  useEffect(() => {
    if (referralCode) {
      localStorage.setItem("referralCode", referralCode);
    }
  }, [referralCode]);

  // Handle form submission - start sign up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setIsLoading(true);
    setError("");

    try {
      // Split name into first and last
      const [firstName, ...lastNameParts] = name.trim().split(" ");
      const lastName = lastNameParts.join(" ");

      await signUp.create({
        emailAddress: email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error("Sign-up error:", err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError("Failed to sign up. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push(redirectTo);
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - matching /schedule style */}
      <header className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/schedule" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Back to Schedule
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
              JOIN THE GYM
            </h1>
            <p className="mt-2 text-gray-400">
              Create your account to get started
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!pendingVerification ? (
              <>
                {/* Sign Up Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="pl-10 h-12 text-base border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="pl-10 h-12 text-base border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || !email || !name}
                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-base"
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

                {/* Sign In Link */}
                <p className="mt-8 text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="font-semibold text-gray-900 hover:text-gray-700"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            ) : (
              <>
                {/* OTP Verification */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Verify your email</h2>
                  <p className="mt-2 text-gray-600">
                    We sent a verification code to<br />
                    <span className="font-medium text-gray-900">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleCodeSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                      Verification code
                    </label>
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="h-12 text-center text-xl tracking-widest font-mono border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                      maxLength={6}
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || code.length < 6}
                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-base"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Verify & Create Account"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="w-full text-gray-600 hover:text-gray-900"
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
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            Join U2Can Boxing and start your journey
          </p>
        </div>
      </footer>
    </div>
  );
}

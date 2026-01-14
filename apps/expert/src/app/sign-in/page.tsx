"use client";

import { useSearchParams } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function CustomSignInPage() {
  const params = useSearchParams();
  const redirectTo = params.get("redirect_url") || "/redirect";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - matching /schedule style */}
      <header className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <Image
              src="/logo.png"
              alt="U2Can Boxing"
              width={80}
              height={80}
              className="rounded-full shadow-lg mb-4"
              priority
            />
            {/* Main Title */}
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tight">
              U2CAN BOXING
            </h1>
            <p className="mt-2 text-gray-400">
              Sign in to your account
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="w-full max-w-md">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "#1f2937",
                colorBackground: "#ffffff",
                colorText: "#111827",
                colorTextSecondary: "#6b7280",
                colorInputBackground: "#ffffff",
                colorInputText: "#111827",
                borderRadius: "0.75rem",
              },
              elements: {
                card: "shadow-xl border-0",
                headerTitle: "text-gray-900 font-bold",
                headerSubtitle: "text-gray-500",
                socialButtonsBlockButton:
                  "border-gray-200 hover:bg-gray-50 transition-colors",
                formFieldInput:
                  "border-gray-300 focus:border-gray-900 focus:ring-gray-900",
                formButtonPrimary:
                  "bg-gray-900 hover:bg-gray-800 text-white font-semibold",
                footerActionLink: "text-gray-900 hover:text-gray-700 font-medium",
                identityPreviewEditButton: "text-gray-600 hover:text-gray-900",
              },
            }}
            fallbackRedirectUrl={redirectTo}
          />
        </div>
      </main>

      {/* Footer - matching /schedule style */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            New to U2Can? Sign up above to get started
          </p>
        </div>
      </footer>
    </div>
  );
}

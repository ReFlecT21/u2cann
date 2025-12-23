import "@adh/tailwind-config/globals.css";

import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { Loader2 } from "lucide-react";

import MainProviders from "./_mainProviders";

export const metadata = {
  title: "PawSwift Dashboard",
  description: "Veterinary appointment management made simple with PawSwift.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body className={GeistSans.className}>
        <Suspense
          fallback={
            <div className="flex h-dvh w-screen items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <MainProviders>{children}</MainProviders>
        </Suspense>
      </body>
    </html>
  );
}

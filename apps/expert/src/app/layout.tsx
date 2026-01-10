import "@adh/tailwind-config/globals.css";

import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { Loader2 } from "lucide-react";

import MainProviders from "./_mainProviders";

export const metadata = {
  title: "Boxing Gym",
  description: "Book boxing classes and manage your membership",
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

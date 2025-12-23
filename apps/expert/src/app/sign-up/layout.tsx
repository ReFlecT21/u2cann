import "@adh/tailwind-config/globals.css";

import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";

export const metadata = {
  title: "PawSwift Dashboard",
  description: "Veterinary appointment management made simple with PawSwift.",
  icons: [{ rel: "icon", url: "/favicon.png" }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className}`}>
        <Suspense
          fallback={
            <div className="flex h-dvh w-screen items-center justify-center">
              Loading...
            </div>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}

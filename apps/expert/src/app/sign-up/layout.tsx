import "@adh/tailwind-config/globals.css";

import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";

export const metadata = {
  title: "Sign Up | Boxing Gym",
  description: "Create your boxing gym account",
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

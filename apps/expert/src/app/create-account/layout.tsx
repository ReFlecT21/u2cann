import { auth } from "@clerk/nextjs/server";

import { Separator } from "@adh/ui/ui/separator";

import { SignOutButton } from "./SignOutButton";

export default function CreateAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // if (
  //   sessionClaims?.metadata.roles?.client &&
  //   sessionClaims?.metadata.roles?.expert
  // ) {
  //   return (
  //     <div className="flex h-screen w-full flex-col items-center justify-center">
  //       <div className="w-screen max-w-sm rounded-lg bg-muted/30 p-4 text-center">
  //         You already have accounts for both client and expert.
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="relative flex h-screen max-h-full w-full flex-col items-center justify-center">
      <div className="max-h-screen w-screen max-w-lg rounded-lg bg-muted/30 p-4 text-center">
        {children}
        <Separator className="my-4" />
        <SignOutButton />
      </div>
    </div>
  );
}

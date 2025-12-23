"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const language = (params?.language as string) || "en";
  const { data: isAdmin, isLoading } =
    api.user.account.isUserInAdminOrg.useQuery();

  useEffect(() => {
    if (!isLoading && isAdmin === false) {
      router.replace(`/${language}/overview`);
    }
  }, [isLoading, isAdmin, router, language]);

  if (isLoading) return null;
  if (!isAdmin) return null;
  return <>{children}</>;
}

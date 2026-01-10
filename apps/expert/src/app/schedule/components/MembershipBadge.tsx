"use client";

import { CreditCard, Infinity, AlertCircle } from "lucide-react";
import { api } from "~/trpc/react";

export function MembershipBadge() {
  const { data: membership, isLoading } = api.gym.public.checkMembership.useQuery();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded-full px-4 py-2 h-8 w-32" />
    );
  }

  if (!membership?.isValid) {
    return (
      <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
        <AlertCircle className="h-4 w-4" />
        <span>No active membership</span>
      </div>
    );
  }

  if (membership.type === "subscription") {
    const renewDate = membership.currentPeriodEnd
      ? new Date(membership.currentPeriodEnd).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : null;

    return (
      <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
        <Infinity className="h-4 w-4" />
        <span>
          Unlimited{renewDate ? ` (renews ${renewDate})` : ""}
        </span>
      </div>
    );
  }

  if (membership.type === "flexi") {
    return (
      <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
        <CreditCard className="h-4 w-4" />
        <span>{membership.sessionsRemaining} sessions remaining</span>
      </div>
    );
  }

  return null;
}

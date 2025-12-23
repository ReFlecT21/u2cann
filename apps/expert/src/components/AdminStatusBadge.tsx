"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@adh/ui/ui/badge";
import { cn } from "@adh/ui";
interface AdminStatusBadgeProps {
  status: string | null;
  database?: "project" | "projectExpert" | "contract" | "invoice" | "adminExpert";
  className?: string;
}

type ProjectStatus = "pending" | "ongoing" | "shortlisted" | "closed" | "rejected";

type ExpertStatus =
  | "applied"
  | "declined"
  | "rejected"
  | "awarded"
  | "signed"
  | "paid"
  | "payment"
  | "invited"
  | "accepted";

type ContractStatus = "approved" | "signed" | "paid" | "pending" | "filled" | "pendingSign";

type InvoiceStatus = "review" | "approved" | "submitted" | "paid";

type AdminExpertStatus = "applied" | "approved" | "declined" | "rejected" | "pending";

export default function AdminStatusBadge({
  status,
  database,
  className,
}: AdminStatusBadgeProps) {
  const t = useTranslations("statusBadge");

  const projectExpertStatusColor: Record<ExpertStatus, string> = {
    applied: "bg-gray-500",
    declined: "bg-red-500",
    rejected: "bg-red-500",
    invited: "bg-yellow-500",
    awarded: "bg-gray-500",
    signed: "bg-yellow-500",
    payment: "bg-yellow-500",
    paid: "bg-green-500",
    accepted: "bg-yellow-500",
  };

  const projectStatusColor: Record<ProjectStatus, string> = {
    pending: "bg-gray-500",
    ongoing: "bg-yellow-500",
    shortlisted: "bg-blue-500",
    closed: "bg-green-500",
    rejected: "bg-red-500",
  };

  const contractStatusColor: Record<ContractStatus, string> = {
    pending: "bg-yellow-500",
    filled: "bg-yellow-500",
    approved: "bg-gray-500",
    signed: "bg-gray-500",
    paid: "bg-green-500",
    pendingSign: "bg-yellow-500",
  };

  const invoiceStatusColor: Record<InvoiceStatus, string> = {
    review: "bg-yellow-500",
    approved: "bg-gray-500",
    submitted: "bg-yellow-500",
    paid: "bg-green-500",
  };

  const adminExpertStatusColor: Record<AdminExpertStatus, string> = {
    applied: "bg-gray-500",
    approved: "bg-green-500",
    declined: "bg-red-500",
    rejected: "bg-red-500",
    pending: "bg-yellow-500",
  };

  const defaultColor = "bg-gray-500";

  const getColor = (): string => {
    switch (database) {
      case "project":
        return projectStatusColor[status as ProjectStatus] || defaultColor;
      case "projectExpert":
        return projectExpertStatusColor[status as ExpertStatus] || defaultColor;
      case "contract":
        return contractStatusColor[status as ContractStatus] || defaultColor;
      case "invoice":
        return invoiceStatusColor[status as InvoiceStatus] || defaultColor;
      case "adminExpert":
        return adminExpertStatusColor[status as AdminExpertStatus] || defaultColor;
      default:
        return defaultColor;
    }
  };

  const getStatusName = (status: string): string => {
    return t(`${database}.${status}` as any);
  };

  return status ? (
    <Badge className={cn(`${getColor()} hover:${getColor()}`, className)}>
      {getStatusName(status)}
    </Badge>
  ) : null;
}

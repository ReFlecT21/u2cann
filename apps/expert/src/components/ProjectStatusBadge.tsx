"use client";

import { cn } from "@adh/ui";
import { Badge } from "@adh/ui/ui/badge";
import { useTranslations } from "next-intl";

interface ProjectStatusBadgeProps {
  status: string | null;
  database?: "project" | "projectExpert" | "contract" | "invoice";
  className?: string;
}

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

type ProjectStatus =
  | "pending"
  | "ongoing"
  | "shortlisted"
  | "closed"
  | "rejected";

type ContractStatus = "approved" | "signed" | "paid" | "pending" | "filled";
type InvoiceStatus = "review" | "approved" | "submitted" | "paid";

export default function ProjectStatusBadge({
  status,
  database,
  className,
}: ProjectStatusBadgeProps) {
  const t = useTranslations("statusBadge");

  const projectExpertStatusColor = {
    applied: "bg-gray-500",
    declined: "bg-red-500",
    rejected: "bg-red-500",
    invited: "bg-yellow-500",
    awarded: "bg-gray-500",
    signed: "bg-yellow-500",
    payment: "bg-yellow-500",
    paid: "bg-green-500",
    accepted: "bg-blue-500",
  };

  const projectStatusColor = {
    pending: "bg-gray-500",
    ongoing: "bg-yellow-500",
    shortlisted: "bg-blue-500",
    closed: "bg-green-500",
    rejected: "bg-red-500",
  };

  const contractStatusColor = {
    pending: "bg-gray-500",
    filled: "bg-gray-500",
    approved: "bg-yellow-500",
    signed: "bg-gray-500",
    paid: "bg-green-500",
  };

  const invoiceStatusColor = {
    review: "bg-yellow-500",
    approved: "bg-yellow-500",
    submitted: "bg-gray-500",
    paid: "bg-green-500",
  };

  const defaultColor = "bg-gray-500";

  const getColor = (): string => {
    if (database === "project") {
      return projectStatusColor[status as ProjectStatus] || defaultColor;
    } else if (database === "projectExpert") {
      return projectExpertStatusColor[status as ExpertStatus] || defaultColor;
    } else if (database === "contract") {
      return contractStatusColor[status as ContractStatus] || defaultColor;
    } else if (database === "invoice") {
      return invoiceStatusColor[status as InvoiceStatus] || defaultColor;
    }
    return defaultColor;
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

"use client";

import Link from "next/link";
import { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Check,
  CheckCircle,
  Circle,
  Eye,
  Linkedin,
  Mail,
  MoreHorizontal,
  Phone,
  Trash,
  X,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@adh/ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adh/ui/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adh/ui/ui/dropdown-menu";
import { Input } from "@adh/ui/ui/input";
import { Label } from "@adh/ui/ui/label";

import { ConfidenceSlider } from "~/components/ConfidenceSlider";
import ProjectStatusBadge from "~/components/ProjectStatusBadge";
import { api } from "~/trpc/react";

interface ProjectExpertDetails {
  id: number;
  expert: {
    id: string;
    fullName: string;
    linkedin: string;
    profileImage: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  answer: {
    questions: string[];
    responses: string[];
    confidence_levels: string[];
  };
  status: string;
  projectStatus: boolean;
}

export const searchFilterFn: FilterFn<ProjectExpertDetails> = (
  row: Row<ProjectExpertDetails>,
  columnId: string,
  filterValue: string,
): boolean => {
  const cellValue = row.getValue(columnId);
  const statusMapping: Record<string, string> = {
    applied: "Applied",
    declined: "Invitation Rejected",
    rejected: "Rejected",
    accepted: "Invitation Accepted",
    awarded: "Awarded",
    signed: "Contract Signed",
    payment: "Pending Payment",
    paid: "Paid",
  };
  // Check if the current column is 'status' and apply the status mapping
  if (columnId === "status") {
    const cellValue: string = row.getValue(columnId);
    const mappedValue: string = statusMapping[cellValue] || cellValue;

    return String(mappedValue)
      .toLowerCase()
      .includes(filterValue.toLowerCase());
  }

  return String(cellValue)
    .toLowerCase()
    .includes(String(filterValue).toLowerCase());
};

export function getColumns(isSuperAdmin: boolean) {
  const t = useTranslations("projectView");
  const columns: ColumnDef<ProjectExpertDetails>[] = [
    {
      accessorKey: "expert_fullName",
      header: "Name",
      cell: ({ getValue }) => {
        const val = getValue() as any;
        return val?.expert_fullName ?? "";
      },
      meta: { isExportOnly: true, notShown: true },
      enableHiding: true,
    },
    {
      accessorKey: "expert_linkedin",
      header: "LinkedIn",
      cell: ({ getValue }) => {
        const val = getValue() as any;
        return val?.expert_linkedin ?? "";
      },
      meta: { isExportOnly: true, notShown: true },
      enableHiding: true,
    },
    // elroy language
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ getValue }) => {
        const val = getValue() as any;
        return val?.company ?? "";
      },
      meta: { isExportOnly: true, notShown: true },
      enableHiding: true,
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ getValue }) => {
        const val = getValue() as any;
        return val?.position ?? "";
      },
      meta: { isExportOnly: true, notShown: true },
      enableHiding: true,
    },
    {
      accessorKey: "about",
      header: "Company Profile",
      cell: ({ getValue }) => {
        const val = getValue() as any;
        return val?.about ?? "";
      },
      meta: { isExportOnly: true, notShown: true },
      enableHiding: true,
    },
    {
      accessorKey: "work_history",
      header: "Work History",
      cell: ({ getValue }) => {
        const workHistory = getValue() as any[];
        if (!Array.isArray(workHistory)) return "";

        return workHistory
          .map(
            (job) =>
              `${job.position} at ${job.companyName} (${job.start} - ${job.end})`,
          )
          .join(" | ");
      },
      meta: { isExportOnly: true, notShown: true },
      enableHiding: true,
    },
    {
      accessorKey: "expert",
      header: t("expertDetails"),
      cell: ({ getValue }) => {
        const expert = getValue() as any;
        const linkedinUsername = expert.linkedin?.split("/").pop();
        return (
          <div className="flex flex-row justify-center space-x-4">
            <img
              src={expert.profileImage}
              alt={expert.fullName}
              className="h-10 w-10 rounded-full"
            />
            <div className="flex flex-col">
              <p className="text-sm font-medium">{expert.fullName}</p>
              <div className="flex items-center space-x-2">
                <Linkedin className="h-4 w-4 text-blue-600" />
                <a
                  href={expert.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500"
                >
                  {linkedinUsername}
                </a>
              </div>
            </div>
          </div>
        );
      },
      meta: { isExportOnly: false, notShown: false },
    },
    {
      accessorKey: "contact",
      header: t("contactDetails"),
      cell: ({ getValue }) => {
        const contact = getValue() as { email: string; phone: string };
        return (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-600" />
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-gray-500"
              >
                {contact.email}
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-500">{contact.phone}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "answer",
      header: t("answers"),
      cell: ({ getValue }) => {
        const answer = getValue() as {
          questions: string[];
          responses: string[];
          confidence_levels: string[];
        };
        if (
          !Array.isArray(answer.questions) ||
          !Array.isArray(answer.responses) ||
          !Array.isArray(answer.confidence_levels)
        ) {
          return null;
        }
        return (
          <div className="flex flex-col items-center space-y-2">
            {answer.responses.map((response, index) => {
              let confidenceIcon;

              switch (answer.confidence_levels[index]) {
                case "low":
                  confidenceIcon = (
                    <CheckCircle className="h-4 w-4 text-red-600" />
                  );
                  break;
                case "medium":
                  confidenceIcon = (
                    <CheckCircle className="h-4 w-4 text-yellow-600" />
                  );
                  break;
                case "high":
                  confidenceIcon = (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  );
                  break;
                default:
                  confidenceIcon = <Circle className="h-4 w-4 text-gray-600" />;
              }
              return (
                <div className="flex space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          Q{index + 1}:
                        </span>

                        {confidenceIcon}
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[800px]">
                      <DialogHeader>
                        <DialogTitle>{t("projectQuestions")}</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {answer.responses.map((response, index) => {
                          // let confidenceIcon;
                          // switch (answer.confidence_levels[index]) {
                          //   case "low":
                          //     confidenceIcon = (
                          //       <CheckCircle className="w-4 h-4 text-red-600" />
                          //     );
                          //     break;
                          //   case "medium":
                          //     confidenceIcon = (
                          //       <CheckCircle className="w-4 h-4 text-yellow-600" />
                          //     );
                          //     break;
                          //   case "high":
                          //     confidenceIcon = (
                          //       <CheckCircle className="w-4 h-4 text-green-600" />
                          //     );
                          //     break;
                          //   default:
                          //     confidenceIcon = (
                          //       <Circle className="w-4 h-4 text-gray-600" />
                          //     );
                          // }

                          return (
                            <div
                              key={index}
                              className="grid gap-2 border-b pb-2"
                            >
                              <Label
                                htmlFor={`answer-${index}`}
                                className="font-semibold"
                              >
                                {answer.questions[index]}
                              </Label>
                              <Input
                                type="text"
                                id={`answer-${index}`}
                                value={response} // Ensure the actual response is displayed
                                readOnly={true}
                              />
                              <ConfidenceSlider
                                className="w-full"
                                id={`confidence-${index}`}
                                value={[
                                  answer.confidence_levels[index] === "low"
                                    ? 0
                                    : answer.confidence_levels[index] ===
                                        "medium"
                                      ? 1
                                      : 2,
                                ]}
                                disabled={true}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <DialogFooter></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })}
          </div>
        );
      },
      meta: { isExportOnly: true, notShown: false },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("status")}
            <ArrowUpDown className="ml-2 h-4" />
          </Button>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return <ProjectStatusBadge status={value} database="projectExpert" />;
      },
      meta: { isExportOnly: true, notShown: false },
    },

    {
      accessorKey: "projectStatus",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("ongoing")}
            <ArrowUpDown className="ml-2 h-4" />
          </Button>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as boolean;
        return value ? (
          <div className="flex flex-row justify-center space-x-2">
            <div>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
        ) : (
          <div className="flex flex-row justify-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
        );
      },
      meta: { isExportOnly: true, notShown: false },
    },

    {
      accessorKey: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const pid = row.original.id;
        const expertId = row.original.expert.id;
        const { mutateAsync: awardExpert } =
          api.admin.project.awardExpert.useMutation({
            onSuccess: () => {
              toast.success(t("awardSuccess"));
              window.location.reload();
            },
          });
        const handleAwarded = async () => {
          await awardExpert({ id: row.original.id });
        };

        const { mutateAsync: rejectExpert } =
          api.admin.project.rejectExpert.useMutation({
            onSuccess: () => {
              toast.success(t("col_rejectSuccess"));
              window.location.reload();
            },
          });
        const handleReject = async () => {
          await rejectExpert({ id: row.original.id });
        };

        const { mutateAsync: deleteExpert } =
          api.admin.project.deleteExpert.useMutation({
            onSuccess: () => {
              toast.success(t("deleteSuccess"));
              window.location.reload();
            },
          });
        const handleDelete = async () => {
          await deleteExpert({ id: row.original.id });
        };

        const { mutateAsync: inviteExpert } =
          api.admin.project.inviteExpert.useMutation({
            onSuccess: () => {
              toast.success(t("inviteSuccess"));
              window.location.reload();
            },
          });
        const handleInvite = async () => {
          console.log("hi", row.original.id);
          await inviteExpert({ id: row.original.id });
        };

        const { mutateAsync: completeProject } =
          api.admin.project.complete.useMutation({
            onSuccess: () => {
              toast.success(t("completeSuccess"));
              window.location.reload();
            },
          });
        const handleComplete = async () => {
          await completeProject({ projectId: row.original.id });
        };
        const { mutateAsync: paidProject } =
          api.admin.project.respondPayment.useMutation({
            onSuccess: () => {
              toast.success(t("paidSuccess"));
              window.location.reload();
            },
          });
        const handlePaid = async () => {
          await paidProject({ id: row.original.id });
        };
        const hasAwarded =
          row.original.status == "awarded" ||
          row.original.status == "signed" ||
          row.original.status == "payment" ||
          row.original.status == "paid" ||
          row.original.status == "completed";
        console.log(row.original.expert.id);
        const hasStarted = row.original.projectStatus;
        const hasAccepted = row.original.status == "accepted";
        const hasNotPaid = row.original.status == "payment";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("col_openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/${isSuperAdmin ? "superadmin" : "admin"}/users-experts/${expertId}`}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  {t("view")}
                </Link>
              </DropdownMenuItem>
              {!hasAwarded && (
                <>
                  <DropdownMenuItem onClick={handleAwarded}>
                    <Check className="mr-1 h-4 w-4" />
                    {t("award")}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleReject}>
                    <X className="mr-1 h-4 w-4" />
                    {t("col_reject")}
                  </DropdownMenuItem>
                  {!hasAccepted && (
                    <DropdownMenuItem onClick={handleInvite}>
                      <Mail className="mr-1 h-4 w-4" />
                      {t("invite")}
                    </DropdownMenuItem>
                  )}
                </>
              )}

              {hasStarted && (
                <DropdownMenuItem onClick={handleComplete}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  {t("complete")}
                </DropdownMenuItem>
              )}
              {hasNotPaid && (
                <DropdownMenuItem onClick={handlePaid}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  {t("paid")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDelete}>
                <Trash className="mr-1 h-4 w-4" />
                {t("col_remove")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  return columns;
}

// This type is used to define the shape of our data.

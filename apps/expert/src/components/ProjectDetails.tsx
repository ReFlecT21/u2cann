import { useRouter } from "next/navigation"; // To Hide/Show Meeting Page
import { Prisma } from "@prisma/client";
import { Info, MessageCircleQuestion, Target, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@adh/ui/ui/button";
import { Card, CardContent } from "@adh/ui/ui/card";
import { Input } from "@adh/ui/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@adh/ui/ui/tabs";
import { Textarea } from "@adh/ui/ui/text-area";

import InputBadgeTextBox from "./InputBadgeDisplayBox";

const acceptedStatuses = ["accepted", "awarded", "signed", "payment", "paid"];

// Data Types to be used in the ProjectDetails Component
export type ProjectInfoDataType = {
  pid: string;
  name: string;
  project_target_country: string[];
  industry: { sub: string }[];
  description: string;
  hub_type: {
    name: string;
  };
  deadline: Date;
  status: string;
};

export type TargetExpertDataType = {
  expert_target_country: string[];
  company_target: string[];
  communication_language: Prisma.JsonArray;
  keyword: object;
  expertise: string[];
  profile: string[];
};

export type QuestionInfoDataType = {
  question: string[];
};

export type ProjectClientInfoDataType = {
  clientId: string;
};
export default function ProjectDetails({
  projectExpertInfoData,
  projectClientInfoData,
  projectInfoData,
  targetInfoData,
  expertQuestionsData,
}: {
  projectExpertInfoData?: { status: string };
  projectClientInfoData?: ProjectClientInfoDataType;
  projectInfoData: ProjectInfoDataType;
  targetInfoData: TargetExpertDataType;
  expertQuestionsData: QuestionInfoDataType;
}) {
  const t = useTranslations("projectView");
  return (
    <>
      <div className="mt-6">
        <h2 className="text-md font-semibold">{t("projectDetailsTitle")}</h2>
      </div>
      <Card className="mt-2 py-2">
        <CardContent className="px-4">
          <Tabs defaultValue="project-info" className="w-full">
            <TabsList className="flex h-10 items-center justify-start gap-1">
              <TabsTrigger
                value="project-info"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
              >
                <Info />
                <span>{t("projectInfoTab")}</span>
              </TabsTrigger>
              {projectClientInfoData?.clientId && (
                <TabsTrigger
                  value="client-info"
                  className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
                >
                  <Users />
                  <span>{t("clientInfoTab")}</span>
                </TabsTrigger>
              )}
              <TabsTrigger
                value="target-expert"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
              >
                <Target />
                <span>{t("targetExpertTab")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="expert-questions"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
              >
                <MessageCircleQuestion />
                <span>{t("expertQuestionsTab")}</span>
              </TabsTrigger>
              {acceptedStatuses.includes(
                projectExpertInfoData?.status ?? "",
              ) ? (
                <TabsTrigger
                  value="meeting"
                  className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
                >
                  <Users />
                  <span>{t("meetingTab")}</span>
                </TabsTrigger>
              ) : null}
            </TabsList>
            {projectClientInfoData && (
              <TabsContent value="client-info">
                <ClientInfo data={projectClientInfoData} />
              </TabsContent>
            )}

            <TabsContent value="project-info">
              <ProjectInfo data={projectInfoData} />
            </TabsContent>
            <TabsContent value="target-expert">
              <TargetExpert data={targetInfoData} />
            </TabsContent>
            <TabsContent value="expert-questions">
              <ExpertQuestions data={expertQuestionsData} />
            </TabsContent>
            <TabsContent value="meeting">
              <Meeting />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}

// ClientInfo Tab
export function ClientInfo({ data }: { data: ProjectClientInfoDataType }) {
  const router = useRouter();
  const t = useTranslations("projectView");
  console.log(data);
  return (
    <>
      <div className="mt-4 text-lg font-semibold">{t("clientInfoTab")}</div>

      <div className="mt-4">
        <Button
          onClick={() => router.push(`/admin/users-clients/${data.clientId}`)}
        >
          {t("viewClient")}
        </Button>
      </div>
    </>
  );
}

// ProjectInfo Tab
export function ProjectInfo({ data }: { data: ProjectInfoDataType }) {
  const date = new Date(data.deadline);
  const t = useTranslations("project");
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <>
      <div className="flex flex-col">
        <div className="mt-4 text-lg font-semibold">{t("projectInfoTab")}</div>

        <div className="mt-4 text-sm font-semibold">{t("projectName")}</div>
        <Input id="projectName" value={data.name || ""} disabled />
        <div className="mt-4 text-sm font-semibold">
          {t("targetProjectCountry")}
          <InputBadgeTextBox
            data={data.project_target_country.map((country) => country)}
          />
        </div>
        <div className="mt-4 text-sm font-semibold">
          {t("industry")}
          <InputBadgeTextBox
            data={data.industry.map((industry) => industry.sub)}
          />
        </div>
        <div className="mt-4 text-sm font-semibold">
          {t("projectDescription")}
        </div>
        <Textarea value={data.description || ""} disabled />
        <div className="mt-4 text-sm font-semibold">{t("hubType")}</div>
        <Input
          id="hubType"
          value={data?.hub_type?.name || ""}
          className="w-56"
          disabled
        />
        <div className="mt-4 text-sm font-semibold">{t("deadlineDate")}</div>
        <Input id="deadline" value={formattedDate || ""} disabled />
      </div>
    </>
  );
}

// TargetExpert Tab
export function TargetExpert({ data }: { data: TargetExpertDataType }) {
  const t = useTranslations("project");
  console.log("hi", data);
  return (
    <>
      <div className="mt-4 text-lg font-semibold">{t("targetExpertTab")}</div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2">
        <div className="mt-4 text-sm font-semibold">
          {t("targetExpertCountry")}
          <InputBadgeTextBox
            data={data.expert_target_country.map((country) => country)}
          />
        </div>

        <div className="mt-4 text-sm font-semibold">
          {t("targetExpertCompany")}
          <InputBadgeTextBox data={data.company_target} />
        </div>

        <div className="mt-4 text-sm font-semibold">
          {t("companyProfile")}
          <InputBadgeTextBox data={data.profile} />
        </div>

        <div className="mt-4 text-sm font-semibold">
          {t("communicationLanguage")}
          <InputBadgeTextBox data={data.communication_language as string[]} />
        </div>

        <div className="mt-4 text-sm font-semibold">
          {t("expertise")}
          <InputBadgeTextBox data={data.expertise} />
        </div>
      </div>
    </>
  );
}

// ExpertQuestions Tab
export function ExpertQuestions({ data }: { data: QuestionInfoDataType }) {
  const t = useTranslations("project");
  return (
    <>
      <div className="mt-4 text-lg font-semibold">
        {t("expertQuestionsTab")}
      </div>
      <div className="mt-4 flex flex-col gap-y-4">
        <p>{t("questionsTitle")}</p>

        {data.question.map((question, index) => (
          <div
            className="flex flex-row items-center space-x-2 text-sm"
            key={index}
          >
            <p>Q{index + 1}</p>
            <Input id={`question${index + 1}`} value={question} disabled />
          </div>
        ))}
      </div>
    </>
  );
}

// Meeting Tab
export function Meeting() {
  return <></>;
}

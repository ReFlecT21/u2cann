"use client";

import { Activity, CheckCircle, Info } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@adh/ui/ui/badge";
import { Card, CardContent } from "@adh/ui/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@adh/ui/ui/tabs";

import { DataTable } from "~/components/ProjectDataTable";
import { api } from "~/trpc/react";
import { getColumns, searchFilterFn } from "./columns";

interface ExpertIdPageProps {
  expertId: string;
  isSuperAdmin: boolean;
}

export default function ExpertIdPage({
  expertId,
  isSuperAdmin,
}: ExpertIdPageProps) {
  const t = useTranslations("userExperts");
  const columnsForOngoingProjects = getColumns(isSuperAdmin, "ongoing");
  const columnsForCompletedProjects = getColumns(isSuperAdmin, "completed");
  // Reusing the same query as the expert project page
  const { data, isLoading, error } = api.admin.expert.getExpertInfo.useQuery({
    expertId,
  });

  if (isLoading) return <div>{t("loading")}.</div>;
  if (error)
    return (
      <div>
        {t("error")}: {error.message}
      </div>
    );
  if (!data) return <div>{t("noData")}</div>;
  console.log(data, "ExpertIdPage");

  // Convert Date objects to strings
  const createdAt = data.expertInfo?.created_at
    ? new Date(data.expertInfo?.created_at).toLocaleDateString()
    : "Not registered";

  // Creating data to pass to the different tabs
  // const projectInfoData: ProjectInfoDataType = {
  //   pid: data.projectInfo?.pid || "",
  //   name: data.projectInfo?.name || "",
  //   project_target_country: Array.isArray(
  //     data.projectInfo?.project_target_country,
  //   )
  //     ? data.projectInfo.project_target_country[0]?.project_country || []
  //     : [],
  //   description: data.projectInfo?.description || "",
  //   hub_type: {
  //     name: data.projectInfo?.hub_type.name || "",
  //   },
  //   industry: data.projectInfo?.project_target_info[0]?.industry_target || [],
  //   deadline: data.projectInfo?.deadline || new Date(),
  //   status: data.projectInfo?.status || "",
  // };

  // const targetInfoData: TargetExpertDataType = {
  //   expert_target_country: Array.isArray(
  //     data.projectInfo?.project_target_country,
  //   )
  //     ? data.projectInfo.project_target_country[0]?.expert_country || []
  //     : [],
  //   company_target: Array.isArray(
  //     data.targetExpertInfo?.project_target_info[0]?.company_target,
  //   )
  //     ? data.targetExpertInfo.project_target_info[0].company_target
  //         .filter((c) => c?.name !== null)
  //         .map((c) => c.name as string)
  //     : [],
  //   communication_language: Array.isArray(
  //     data.targetExpertInfo?.project_target_info[0]?.communication_language,
  //   )
  //     ? data.targetExpertInfo?.project_target_info[0]?.communication_language
  //     : [],
  //   keyword: {}, // TODO: Add this
  //   expertise: [], // TODO: Add this
  //   profile: [], // TODO: Add this
  // };
  // const expertQuestionsData: QuestionInfoDataType = {
  //   question: data.questionInfo?.questions || [],
  // };
  const handleClickProjectInfo = (index: number) => {
    const project = data[index];
    console.log(project);
    // TODO: bug fix when click dropdown options on the project, this is getting invoked

    // if (project) {
    //   routerPush(
    //     router,
    //     `/${isSuperAdmin ? "superadmin" : "admin"}/projects/${project.pid}`,
    //   );
    // }
  };
  return (
    <>
      <div className="mt-4">
        <Card className="rounded-lg border p-4">
          <div className="grid grid-cols-3 items-center gap-6">
            {/* Left Column: Profile Info */}
            <div className="col-span-1 flex flex-col items-center">
              <div className="h-32 w-32 overflow-hidden rounded-lg bg-gray-200">
                <img
                  className="h-full w-full object-cover"
                  src={data.expertInfo.img_url ?? "/images/svg/avatar.svg"}
                  alt="Profile"
                />
              </div>
              <Badge
                className={`mt-3 rounded-full px-3 py-1 text-sm font-bold text-white ${
                  data.expertInfo.created_at ? "bg-blue-600" : "bg-red-500"
                }`}
              >
                <i
                  className={`fa-solid ${
                    data.expertInfo.created_at
                      ? "fa-badge-check"
                      : "fa-circle-xmark"
                  } me-1`}
                ></i>
                {data.expertInfo.created_at
                  ? t("registeredUser")
                  : t("notRegisteredUser")}
              </Badge>
              <h5 className="mt-2 text-lg font-semibold">
                {data.expertInfo.fullName ?? "N/A"}
              </h5>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <i className="fa-solid fa-envelope"></i>
                <span>{data.expertInfo.email ?? t("noEmail")}</span>
                <span className="cursor-pointer text-blue-500">
                  <i className="fa-solid fa-pen-to-square"></i>
                </span>
              </div>
            </div>

            {/* Right Column: Project Stats & Info */}
            <div className="col-span-2">
              <div className="mb-4 grid grid-cols-3 gap-4">
                <Card className="rounded-lg bg-blue-600 py-3 text-center text-white shadow">
                  <span className="text-xl font-bold">
                    {data.expertInfo.totalProjectCount ?? 0}
                  </span>
                  <p className="text-sm">{t("totalProjects")}</p>
                </Card>
                <Card className="rounded-lg bg-green-500 py-3 text-center text-white shadow">
                  <span className="text-xl font-bold">
                    {data.expertInfo.completedProjectCount ?? 0}
                  </span>
                  <p className="text-sm">{t("completedProjects")}</p>
                </Card>
                <Card className="rounded-lg bg-yellow-500 py-3 text-center text-white shadow">
                  <span className="text-xl font-bold">
                    {data.expertInfo.ongoingProjectCount ?? 0}
                  </span>
                  <p className="text-sm"> {t("ongoingProjects")}</p>
                </Card>
              </div>

              <hr className="my-4" />
              <h6 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t("expertBasicInfo")}
              </h6>
              <div className="mt-3 grid grid-cols-4 gap-4 text-sm text-gray-700">
                <div>
                  <span className="font-medium"> {t("linkedIn")}</span>
                  <a
                    href={data.expertInfo.linkedIn}
                    className="flex items-center space-x-1 text-blue-500"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fa-brands fa-linkedin"></i>
                    <span>
                      {data.expertInfo.linkedIn
                        ? data.expertInfo.linkedIn.replace(
                            "https://www.linkedin.com/in/",
                            "",
                          )
                        : "N/A"}
                    </span>
                  </a>
                </div>
                <div>
                  <span className="font-medium">{t("country")}:</span>
                  <p>{data.expertInfo.country ?? "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium">{t("address")}:</span>
                  <p>{data.expertInfo.address ?? "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium"> {t("registerAt")}:</span>
                  <p>{createdAt}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      {/* <ProjectDetails
        projectInfoData={projectInfoData}
        targetInfoData={targetInfoData}
        expertQuestionsData={expertQuestionsData}
      /> */}
      <div className="mt-6">
        <h2 className="text-md font-semibold">{t("projectDetails")}</h2>
      </div>
      <Card className="mt-2 py-2">
        <CardContent className="px-4">
          <Tabs defaultValue="expert-details" className="w-full">
            <TabsList className="flex h-10 items-center justify-start gap-1">
              <TabsTrigger
                value="expert-details"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
              >
                <Info />
                <span>{t("tabExpertDetails")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="ongoing-projects"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
              >
                <Activity />
                <span>{t("tabOngoing")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="completed-projects"
                className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
              >
                <CheckCircle />
                <span>{t("tabCompleted")}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expert-details">
              {/* About Section */}
              <div className="mb-4">
                <div className="mt-4 text-lg font-semibold text-blue-600">
                  {t("about")}
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  {data.expertInfo.about ?? t("noDescription")}
                </p>
              </div>

              {/* Industry Section */}
              <div className="mt-4 text-lg font-semibold text-blue-600">
                {t("industry")}
              </div>
              <div className="mb-4 flex items-center gap-4">
                <span className="font-medium">{t("mainIndustry")}</span>
                <Badge className="rounded-md bg-gray-200 px-2 py-1 text-gray-700">
                  {data.expertInfo.mainIndustry ?? "N/A"}
                </Badge>
                <span className="font-medium">{t("subIndustry")}</span>
                <Badge className="rounded-md bg-gray-200 px-2 py-1 text-gray-700">
                  {data.expertInfo.subIndustry ?? "N/A"}
                </Badge>
              </div>

              {/* Work Experiences */}
              <div className="mt-4 text-lg font-semibold text-blue-600">
                {t("workExperiences")}
              </div>
              <div className="mb-4 overflow-hidden rounded-md border">
                <table className="w-full text-sm text-gray-700">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">{t("company")}</th>
                      <th className="p-2 text-left">{t("position")}</th>
                      <th className="p-2 text-left">{t("location")}</th>
                      <th className="p-2 text-left">{t("duration")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(data.expertInfo.experiences) &&
                    data.expertInfo.experiences.length > 0 ? (
                      data.expertInfo.experiences.map((exp, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{exp?.companyName}</td>
                          <td className="p-2">{exp?.position}</td>
                          <td className="p-2">{exp?.country}</td>
                          <td className="p-2">
                            {exp?.start} - {exp?.end}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-2 text-center text-gray-500"
                        >
                          {t("noWorkExperience")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Skills Section */}
              <div className="mt-4 text-lg font-semibold text-blue-600">
                {t("skills")}
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {data.expertInfo.skills?.map((skill, index) => (
                  <Badge
                    key={index}
                    className="rounded-md bg-gray-200 px-2 py-1 text-gray-700"
                  >
                    {skill}
                  </Badge>
                )) || <p className="text-sm text-gray-500">{t("noSkills")}</p>}
              </div>

              {/* Languages Section */}
              <div className="mt-4 text-lg font-semibold text-blue-600">
                {t("languages")}
              </div>
              <p className="text-sm text-gray-700">
                {data.expertInfo.languages ?? t("noLanguage")}
              </p>
              <div className="mt-6">
                <div className="mt-4 text-lg font-semibold text-blue-600">
                  Payment Information
                </div>

                {data.expertInfo.paymentDetails ? (
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    {"bank_name" in data.expertInfo.paymentDetails && (
                      <>
                        <div>
                          <span className="font-medium">Bank Name:</span>{" "}
                          {data.expertInfo.paymentDetails.bank_name}
                        </div>
                        <div>
                          <span className="font-medium">Account Number:</span>{" "}
                          {data.expertInfo.paymentDetails.bank_account_number}
                        </div>
                        <div>
                          <span className="font-medium">Account Type:</span>{" "}
                          {data.expertInfo.paymentDetails.bank_account_type}
                        </div>
                        <div>
                          <span className="font-medium">Account Holder:</span>{" "}
                          {data.expertInfo.paymentDetails.account_holder_name}
                        </div>
                        <div>
                          <span className="font-medium">Branch Name:</span>{" "}
                          {data.expertInfo.paymentDetails.branch_name}
                        </div>
                      </>
                    )}

                    {"paypal_user_id" in data.expertInfo.paymentDetails && (
                      <>
                        <div>
                          <span className="font-medium">PayPal User ID:</span>{" "}
                          {data.expertInfo.paymentDetails.paypal_user_id}
                        </div>
                        <div>
                          <span className="font-medium">PayPal Email:</span>{" "}
                          {data.expertInfo.paymentDetails.paypal_email}
                        </div>
                      </>
                    )}

                    {"wise_user_id" in data.expertInfo.paymentDetails && (
                      <>
                        <div>
                          <span className="font-medium">Wise User ID:</span>{" "}
                          {data.expertInfo.paymentDetails.wise_user_id}
                        </div>
                        <div>
                          <span className="font-medium">Wise Email:</span>{" "}
                          {data.expertInfo.paymentDetails.wise_email}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not Yet Added</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ongoing-projects">
              <div className="mt-4">
                <div className="mt-4">
                  <DataTable
                    columns={columnsForOngoingProjects}
                    data={data.expertProjectDetails}
                    onClickFunction={(index) => handleClickProjectInfo(index)}
                    filterFn={searchFilterFn}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="completed-projects">
              <div className="mt-4">
                <div className="mt-4">
                  <DataTable
                    columns={columnsForCompletedProjects}
                    data={data.expertCompletedProjectDetails}
                    onClickFunction={(index) => handleClickProjectInfo(index)}
                    filterFn={searchFilterFn}
                  />
                </div>
              </div>
            </TabsContent>
            {/* <TabsContent value="meeting">
              <Meeting />
            </TabsContent> */}
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@adh/ui/ui/badge";
import { Button } from "@adh/ui/ui/button";
import { Card, CardContent } from "@adh/ui/ui/card";
import { Input } from "@adh/ui/ui/input";
import { Label } from "@adh/ui/ui/label";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@adh/ui/ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@adh/ui/ui/tabs";

import { DataTable } from "~/components/ProjectDataTable";
import { api } from "~/trpc/react";
import { ApprovalBanner } from "./ApprovalBanner";
import { getColumns, searchFilterFn } from "./columns";

interface CompaniesSettingsData {
  clientId: string;
  name?: string;
  status?: string;
  website?: string;
  linkedin_url?: string;
  establish?: number;
  companyIndustry?: string[];
  about?: string;
  ceo?: string;
  company_finance?: {
    headcount?: number;
    fy_period?: string;
    currency?: string;
    revenue?: number;
    operating_profit?: number;
    net_profit?: number;
    ebitda?: number;
    total_assets?: number;
  };
  address?: string;
  zip_code?: string;
  country?: string;
  state?: string;
  phone?: string;
  department?: string;
}

interface IndividualComapaniesSettingsData {
  clientId: string;
  companyName?: string;
  title?: string;
  companyWebsite?: string;
  companyIndustry?: string[];
  companyAddress?: string;
}
interface ExpertIdPageProps {
  clientId: string;
  isSuperAdmin: boolean;
}

export default function ExpertIdPage({
  clientId,
  isSuperAdmin,
}: ExpertIdPageProps) {
  const t = useTranslations("userClients");
  const { data: industryOptions } = api.admin.company.getIndustries.useQuery();
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const { mutateAsync: updateIndivCompany } =
    api.admin.client.updateIndivCompanyDetails.useMutation();
  const { mutateAsync: updateCorpCompany } =
    api.admin.client.updateCompanyDetails.useMutation();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();
  const {
    register: register2, // Alias to avoid conflicts
    handleSubmit: handleSubmit2, // Second form's handleSubmit
    control: control2,
    formState: { errors: errors2 },
  } = useForm();
  const onSubmit = async (data: CompaniesSettingsData) => {
    const transformedData = {
      ...data,
      clientId,
      establish: data.establish ? Number(data.establish) : undefined,
      company_finance: data.company_finance
        ? {
            ...data.company_finance,
            headcount: data.company_finance.headcount
              ? Number(data.company_finance.headcount)
              : undefined,
            revenue: data.company_finance.revenue
              ? Number(data.company_finance.revenue)
              : undefined,
            operating_profit: data.company_finance.operating_profit
              ? Number(data.company_finance.operating_profit)
              : undefined,
            net_profit: data.company_finance.net_profit
              ? Number(data.company_finance.net_profit)
              : undefined,
            ebitda: data.company_finance.ebitda
              ? Number(data.company_finance.ebitda)
              : undefined,
            total_assets: data.company_finance.total_assets
              ? Number(data.company_finance.total_assets)
              : undefined,
          }
        : undefined,
    };
    const isSuccess = await updateCorpCompany(transformedData);

    if (isSuccess) {
      toast.success("Company Details Updated Successfully.");
      window.location.reload(); // ✅ Refresh the page after update
    }
  };
  const onSubmitIndiv = async (data: IndividualComapaniesSettingsData) => {
    const transformedData = {
      ...data,
      title: data.title ?? "Default Title", // Provide a default value for title
      clientId,
    };

    const isSuccess = await updateIndivCompany(transformedData);

    if (isSuccess) {
      toast.success("Company Details Updated Successfully.");
      window.location.reload(); // ✅ Refresh the page after update
    }
  };
  const { data: approved } =
    api.admin.client.checkCorporateUserApproval.useQuery({
      userId: clientId,
    });

  const { data: role } = api.admin.client.getClientRoles.useQuery({
    clientId,
  });

  // Effect to update availableTabs once role data is fetched
  useEffect(() => {
    if (role && role.roles) {
      const tabs: string[] = [];

      if (role.roles.individual?.filledUp) {
        tabs.push("individual");
      }
      if (role.roles.corporate?.filledUp) {
        tabs.push("corporate");
      }

      setAvailableTabs(tabs);
    }
  }, [role]); // Runs when role data updates

  const handleClickProjectInfo = (index: number) => {
    console.log("Project Info", index);
  };
  const columnsForOngoingProjects = getColumns(isSuperAdmin, "ongoing");
  const columnsForCompletedProjects = getColumns(isSuperAdmin, "completed");
  const { data, isLoading, error } =
    api.admin.client.getIndividualClientInfo.useQuery({
      clientId,
    });

  const {
    data: corporateData,
    isLoading: CorporateIsLoading,
    error: CorporateError,
  } = api.admin.client.getCorporateClientInfo.useQuery({
    clientId,
  });
  console.log("data", data, "corpData", corporateData);

  // Convert Date objects to strings
  const createdAt = data?.clientInfo.created_at
    ? new Date(data?.clientInfo.created_at).toLocaleDateString()
    : "Not registered";
  if (isLoading || CorporateIsLoading) return <div>{t("loading")}</div>;
  if (error || CorporateError)
    return (
      <div>
        {t("error")} {error?.message || CorporateError?.message}
      </div>
    );
  if (!data && !corporateData) return <div>{t("noData")}</div>;

  return (
    <>
      <Tabs defaultValue={availableTabs[0]} className="w-full">
        <TabsList className="flex h-10 items-center justify-start gap-2 bg-gray-100 p-2">
          {availableTabs.includes("individual") && (
            <TabsTrigger
              value="individual"
              className="border-b-2 border-transparent px-4 py-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
            >
              {t("tabs.individual")}
            </TabsTrigger>
          )}
          {availableTabs.includes("corporate") && (
            <TabsTrigger
              value="corporate"
              className="border-b-2 border-transparent px-4 py-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
            >
              {t("tabs.corporate")}
            </TabsTrigger>
          )}
        </TabsList>

        {availableTabs.map((tab) => (
          <TabsContent key={tab} value={tab}>
            {!approved && (
              <ApprovalBanner approved={approved} userId={clientId} />
            )}
            <div className="mt-4">
              <Card className="rounded-lg border p-4">
                <div className="grid grid-cols-3 items-center gap-6">
                  {/* Left Column: Profile Info */}
                  <div className="col-span-1 flex flex-col items-center">
                    <div className="h-32 w-32 overflow-hidden rounded-lg bg-gray-200">
                      <img
                        className="h-full w-full object-cover"
                        src={
                          data?.clientInfo.img_url ?? "/images/svg/avatar.svg"
                        }
                        alt="Profile"
                      />
                    </div>
                    <Badge
                      className={`mt-3 rounded-full px-3 py-1 text-sm font-bold text-white ${
                        data?.clientInfo.created_at
                          ? "bg-blue-600"
                          : "bg-red-500"
                      }`}
                    >
                      <i
                        className={`fa-solid ${
                          data?.clientInfo.created_at
                            ? "fa-badge-check"
                            : "fa-circle-xmark"
                        } me-1`}
                      ></i>
                      {data?.clientInfo.created_at
                        ? "REGISTERED USER"
                        : "NOT REGISTERED"}
                    </Badge>
                    <h5 className="mt-2 text-lg font-semibold">
                      {data?.clientInfo.fullName ?? "N/A"}
                    </h5>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <i className="fa-solid fa-envelope"></i>
                      <span>
                        {data?.clientInfo.email ?? "No email contact"}
                      </span>
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
                          {tab === "individual"
                            ? (data?.clientInfo.totalProjectCount ?? 0)
                            : (corporateData?.clientInfo.totalProjectCount ??
                              0)}
                        </span>
                        <p className="text-sm">{t("totalProjects")}</p>
                      </Card>
                      <Card className="rounded-lg bg-green-500 py-3 text-center text-white shadow">
                        <span className="text-xl font-bold">
                          {tab === "individual"
                            ? (data?.clientInfo.completedProjectCount ?? 0)
                            : (corporateData?.clientInfo
                                .completedProjectCount ?? 0)}
                        </span>
                        <p className="text-sm">{t("completedProjects")}</p>
                      </Card>
                      <Card className="rounded-lg bg-yellow-500 py-3 text-center text-white shadow">
                        <span className="text-xl font-bold">
                          {tab === "individual"
                            ? (data?.clientInfo.ongoingProjectCount ?? 0)
                            : (corporateData?.clientInfo.ongoingProjectCount ??
                              0)}
                        </span>
                        <p className="text-sm">{t("ongoingProjects")}</p>
                      </Card>
                    </div>
                    <hr className="my-4" />
                    <h6 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      {t("clientBasicInfo")}
                    </h6>
                    <div className="mt-3 grid grid-cols-4 gap-4 text-sm text-gray-700">
                      <div>
                        <span className="font-medium">{t("linkedIn")}</span>
                        <a
                          href={data?.clientInfo.linkedIn}
                          className="flex items-center space-x-1 text-blue-500"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fa-brands fa-linkedin"></i>
                          <span>
                            {data?.clientInfo.linkedIn
                              ? data?.clientInfo.linkedIn.replace(
                                  "https://www.linkedin.com/in/",
                                  "",
                                )
                              : "N/A"}
                          </span>
                        </a>
                      </div>
                      <div>
                        <span className="font-medium">{t("phone")}</span>
                        <p>
                          {data?.clientInfo.phone?.trim()
                            ? data.clientInfo.phone
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <span className="font-medium">{t("registerAt")}</span>
                        <p>{createdAt}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="mt-6">
              <h2 className="text-md font-semibold">{t("projectDetails")}</h2>
            </div>
            <Card className="mt-2 py-2">
              <CardContent className="px-4">
                <Tabs defaultValue="client-details" className="w-full">
                  <TabsList className="flex h-10 items-center justify-start gap-1">
                    <TabsTrigger
                      value="client-details"
                      className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
                    >
                      <Info />
                      <span>{t("tabs.companyDetails")}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="ongoing-projects"
                      className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
                    >
                      <Activity />
                      <span>{t("tabs.ongoingProjects")}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed-projects"
                      className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-500"
                    >
                      <CheckCircle />
                      <span>{t("tabs.completedProjects")}</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="client-details">
                    {tab === "individual" ? (
                      <form
                        onSubmit={handleSubmit(onSubmitIndiv)}
                        className="space-y-4"
                      >
                        <Card className="mt-4">
                          <CardContent className="mt-4">
                            <div className="space-y-4">
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("companyName")}{" "}
                                  <span className="text-red-600">*</span>
                                </h2>
                                <Input
                                  {...register("companyName")}
                                  defaultValue={
                                    data?.clientInfo.companyDetails.name
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("title")}
                                  <span className="text-red-600">*</span>
                                </h2>
                                <Input
                                  {...register("title")}
                                  defaultValue={data?.clientInfo.position || ""}
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("companyWebsite")}
                                  <span className="text-red-600">*</span>
                                </h2>
                                <Input
                                  {...register("companyWebsite")}
                                  defaultValue={
                                    data?.clientInfo.companyDetails.website ||
                                    ""
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <h2 className="text-sm font-semibold">
                                  {t("industryClassification")}
                                  <span className="text-red-600">*</span>
                                </h2>
                                <Controller
                                  name="companyIndustry"
                                  control={control}
                                  defaultValue={
                                    data?.clientInfo.companyDetails
                                      .companyIndustry ?? []
                                  }
                                  render={({
                                    field,
                                  }: {
                                    field: {
                                      value: string[];
                                      onChange: (value: string[]) => void;
                                    };
                                  }) => (
                                    <MultiSelector
                                      values={
                                        Array.isArray(field.value)
                                          ? field.value
                                          : []
                                      } // Ensure value is always an array
                                      onValuesChange={field.onChange}
                                      className="w-full"
                                    >
                                      <MultiSelectorTrigger>
                                        <MultiSelectorInput placeholder="Select Industries" />
                                      </MultiSelectorTrigger>
                                      <MultiSelectorContent>
                                        <MultiSelectorList>
                                          {industryOptions &&
                                            Object.entries(industryOptions).map(
                                              ([category, subcategories]) =>
                                                subcategories.map(
                                                  (subcategory, i) => (
                                                    <MultiSelectorItem
                                                      key={`${category}-${i}`}
                                                      value={`${subcategory}`}
                                                    >
                                                      {category} {`>`}{" "}
                                                      {subcategory}
                                                    </MultiSelectorItem>
                                                  ),
                                                ),
                                            )}
                                        </MultiSelectorList>
                                      </MultiSelectorContent>
                                    </MultiSelector>
                                  )}
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("companyAddress")}
                                </h2>
                                <Input
                                  {...register("companyAddress")}
                                  defaultValue={
                                    data?.clientInfo.companyDetails.address ||
                                    ""
                                  }
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Button className="mt-6 w-full bg-red-500 text-white hover:bg-red-600">
                          {t("save")}
                        </Button>
                      </form>
                    ) : (
                      <form
                        onSubmit={handleSubmit2(onSubmit)}
                        className="space-y-4"
                      >
                        <Card className="mt-4">
                          <CardContent className="mt-4">
                            <div className="space-y-4">
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("companyName")}
                                </h2>
                                <Input
                                  {...register2("name")}
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .name
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("companyWebsite")}
                                </h2>
                                <Input
                                  {...register2("website")}
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .website
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("status")}
                                </h2>
                                <Input
                                  {...register2("status")}
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .status || ""
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>{t("industryClassification")}</Label>
                                <Controller
                                  name="companyIndustry"
                                  control={control}
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .companyIndustry ?? []
                                  }
                                  render={({
                                    field,
                                  }: {
                                    field: {
                                      value: string[];
                                      onChange: (value: string[]) => void;
                                    };
                                  }) => (
                                    <MultiSelector
                                      values={
                                        Array.isArray(field.value)
                                          ? field.value
                                          : []
                                      } // Ensure value is always an array
                                      onValuesChange={field.onChange}
                                      className="w-full"
                                    >
                                      <MultiSelectorTrigger>
                                        <MultiSelectorInput placeholder="Select Industries" />
                                      </MultiSelectorTrigger>
                                      <MultiSelectorContent>
                                        <MultiSelectorList>
                                          {industryOptions &&
                                            Object.entries(industryOptions).map(
                                              ([category, subcategories]) =>
                                                subcategories.map(
                                                  (subcategory, i) => (
                                                    <MultiSelectorItem
                                                      key={`${category}-${i}`}
                                                      value={`${subcategory}`}
                                                    >
                                                      {category} {`>`}{" "}
                                                      {subcategory}
                                                    </MultiSelectorItem>
                                                  ),
                                                ),
                                            )}
                                        </MultiSelectorList>
                                      </MultiSelectorContent>
                                    </MultiSelector>
                                  )}
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("ceo")}
                                </h2>
                                <Input
                                  {...register2("ceo")}
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .ceo || ""
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("establishmentYear")}
                                </h2>
                                <Input
                                  {...register2("establish")}
                                  type="number"
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .establish || ""
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {" "}
                                  {t("about")}
                                </h2>
                                <Input
                                  {...register2("about")}
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .about || ""
                                  }
                                />
                              </div>
                              <h3 className="text-lg font-semibold">
                                {t("financialInfo")}
                              </h3>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("headcount")}
                                </h2>
                                <Input
                                  {...register2("company_finance.headcount")}
                                  type="number"
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .company_finance.headcount || ""
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("fyPeriod")}
                                </h2>
                                <Input
                                  {...register2("company_finance.fy_period")}
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .company_finance.fy_period || ""
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("currency")}
                                </h2>
                                <Input
                                  {...register2("company_finance.currency")}
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .company_finance.currency || ""
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("revenue")}
                                </h2>
                                <Input
                                  {...register2("company_finance.revenue")}
                                  type="number"
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .company_finance.revenue || ""
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("operatingProfit")}
                                </h2>
                                <Input
                                  {...register2(
                                    "company_finance.operating_profit",
                                  )}
                                  type="number"
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .company_finance.operating_profit || ""
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("netProfit")}
                                </h2>
                                <Input
                                  {...register2("company_finance.net_profit")}
                                  type="number"
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .company_finance.net_profit || ""
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("ebitda")}
                                </h2>
                                <Input
                                  {...register2("company_finance.ebitda")}
                                  type="number"
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .company_finance.ebitda || ""
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("totalAssets")}
                                </h2>
                                <Input
                                  {...register2("company_finance.total_assets")}
                                  type="number"
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .company_finance.total_assets || ""
                                  }
                                />
                              </div>
                              <h3 className="text-lg font-semibold">
                                {t("location")}
                              </h3>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("address")}
                                </h2>
                                <Input
                                  {...register2("address")}
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .address || ""
                                  }
                                />
                              </div>
                              <div>
                                <h2 className="text-sm font-semibold">
                                  {t("phone")}
                                </h2>
                                <Input
                                  {...register2("phone")}
                                  defaultValue={
                                    corporateData?.clientInfo.companyDetails
                                      .phone || ""
                                  }
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Button className="mt-6 w-full bg-red-500 text-white hover:bg-red-600">
                          {t("save")}
                        </Button>
                      </form>
                    )}
                  </TabsContent>

                  <TabsContent value="ongoing-projects">
                    <div className="mt-4">
                      <div className="mt-4">
                        <DataTable
                          columns={columnsForOngoingProjects}
                          data={
                            tab === "individual"
                              ? data.ongoingProjects
                              : corporateData?.ongoingProjects
                          }
                          onClickFunction={(index) =>
                            handleClickProjectInfo(index)
                          }
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
                          data={
                            tab === "individual"
                              ? data.completedProjects
                              : corporateData?.completedProjects
                          }
                          onClickFunction={(index) =>
                            handleClickProjectInfo(index)
                          }
                          filterFn={searchFilterFn}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

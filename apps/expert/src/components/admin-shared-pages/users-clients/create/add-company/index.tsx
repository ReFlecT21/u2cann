"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

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

import { translateText } from "~/components/translateText";
import { api } from "~/trpc/react";

interface CompaniesSettingsData {
  userId: string;
  name: string;
  status?: string;
  website?: string;
  linkedin_url?: string;
  establish?: number;
  industry?: string[];
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
  companyId?: number; //  Added companyId
}

export default function CompaniesSettingPage() {
  return (
    <div>
      <CompaniesUpdatePage />
    </div>
  );
}

function CompaniesUpdatePage() {
  const { mutateAsync } = api.user.company.createCompanyForAdmin.useMutation();

  const t = useTranslations("companyForm");
  const params = useParams(); // ✅ Add this
  const language = params?.language; // ✅ Add this
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompaniesSettingsData>();
  const router = useRouter();

  const { data: industryOptions } = api.admin.company.getIndustries.useQuery();
  const [dropdownKey, setDropdownKey] = useState(0);
  const [translatedIndustryOptions, setTranslatedIndustryOptions] = useState<
    Record<string, string[]> | undefined
  >(undefined); // ✅ Add this

  useEffect(() => {
    const translateIndustries = async () => {
      if (language === "jp" && industryOptions) {
        const translated: Record<string, string[]> = {};

        for (const [category, subcategories] of Object.entries(
          industryOptions,
        )) {
          const translatedCategory = await translateText(category, "ja");
          const translatedSubcategories = await Promise.all(
            subcategories.map((sub) => translateText(sub, "ja")),
          );
          translated[translatedCategory || category] =
            translatedSubcategories.map((t, i) => t || subcategories[i]);
        }

        setTranslatedIndustryOptions(translated);
      } else {
        setTranslatedIndustryOptions(industryOptions);
      }
    };

    translateIndustries();
  }, [industryOptions, language]); // ✅ Add effect

  const onSubmit = async (data: CompaniesSettingsData) => {
    console.log("Form data: ", data);
    const transformedData = {
      ...data,
      userId: localStorage.getItem("userId") || "",
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
    const isSuccess = await mutateAsync(transformedData);

    if (isSuccess) {
      toast.success("Company Details Updated Successfully.");
      router.push("/admin/users-clients/create");
    }
  };

  const fillUsingZoomInfo =
    api.registration.client.fillUsingZoomInfo.useMutation({
      onSuccess: (data) => {
        console.log("ZoomInfo data: ", data);
        setValue("companyId", data.companyId);
        setValue("website", data.website || "");
        setValue("status", data.companyStatus || "");
        setValue("linkedin_url", data.linkedin_url || "");
        setValue("establish", data.establish || undefined);
        setValue("about", data.about || "");
        setValue("company_finance.headcount", data.headcount || undefined);
        setValue("company_finance.revenue", data.revenue || undefined);
        setValue("zip_code", data.zip_code || "");
        setValue("state", data.state || "");
        setValue("country", data.country || "");
        setValue("address", data.address || "");
        setValue("phone", data.phone || "");

        const industryIdStr = String(data.primaryIndustryId);
        const subLabel = data.subIndustry || "Unnamed Subindustry";

        const allIds = Object.values(industryOptions || {}).flat();
        const dropdownHasId = allIds.includes(industryIdStr);

        if (!dropdownHasId && industryOptions) {
          const group = industryOptions[data.primaryIndustry];

          if (group) {
            group.push(industryIdStr);
          } else {
            industryOptions[data.primaryIndustry] = [industryIdStr];
          }
        }

        if (!dropdownHasId && industryOptions) {
          const key = data.primaryIndustry!;
          industryOptions[key] ??= [];
          industryOptions[key].push(industryIdStr);
          setDropdownKey((prev) => prev + 1);
        }

        setValue("industry", [subLabel]);
        toast.success("ZoomInfo data filled!");
      },

      onError: (err: any) => {
        toast.error("ZoomInfo lookup failed: " + err.message);
      },
    });

  return (
    <div>
      <div className="mt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* ✅ Required Company Details */}
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <Label className="text-sm font-semibold">
                      {t("companyName")} <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      {...register("name", { required: true })}
                      placeholder={t("companyNamePlaceholder")}
                    />
                  </div>

                  <Button
                    type="button"
                    className="bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => {
                      const companyName = watch("name"); // 🧠 get company name from form

                      if (!companyName) {
                        toast.error(t("missingCompanyName"));
                        return;
                      }

                      fillUsingZoomInfo.mutate({
                        companyName,
                        website: "", // optional field
                      });
                    }}
                  >
                    {t("fillZoomInfo")}
                  </Button>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("companyWebsite")}{" "}
                    <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    {...register("website", { required: true })}
                    placeholder={t("companyWebsitePlaceholder")}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold">
                    {t("status")} <span className="text-red-600">*</span>
                  </Label>
                  <select
                    {...register("status", { required: true })}
                    className="w-full rounded-md border border-gray-300 p-2"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {t("select")}
                    </option>
                    <option value="listed">{t("listed")}</option>
                    <option value="private">{t("private")}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label>{t("industryClassification")}</Label>
                    <span className="text-red-600">*</span>

                    <Controller
                      name="industry"
                      control={control}
                      defaultValue={fillUsingZoomInfo.data?.subIndustry ?? []}
                      render={({
                        field,
                      }: {
                        field: {
                          value: string[];
                          onChange: (value: string[]) => void;
                        };
                      }) => (
                        <MultiSelector
                          values={Array.isArray(field.value) ? field.value : []} // Ensure value is always an array
                          onValuesChange={field.onChange}
                          className="w-full"
                        >
                          <MultiSelectorTrigger>
                            <MultiSelectorInput
                              placeholder={t("industryPlaceholder")}
                            />
                          </MultiSelectorTrigger>
                          <MultiSelectorContent>
                            <MultiSelectorList>
                              {translatedIndustryOptions &&
                                Object.entries(translatedIndustryOptions).map(
                                  ([category, subcategories]) =>
                                    subcategories.map((subcategory, i) => (
                                      <MultiSelectorItem
                                        key={`${category}-${i}`}
                                        value={`${subcategory}`}
                                      >
                                        {category} {`>`} {subcategory}
                                      </MultiSelectorItem>
                                    )),
                                )}
                            </MultiSelectorList>
                          </MultiSelectorContent>
                        </MultiSelector>
                      )}
                    />

                    {errors.industry && (
                      <p className="text-sm text-red-500">
                        {errors.industry.message as string}
                      </p>
                    )}
                  </div>

                  {errors.industry && (
                    <p className="text-sm text-red-500">
                      {errors.industry.message as string}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-semibold">{t("ceo")}</Label>
                  <Input
                    {...register("ceo")}
                    placeholder={t("ceoPlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("establishmentYear")}
                  </Label>
                  <Input
                    type="number"
                    {...register("establish")}
                    placeholder={t("establishmentYearPlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">{t("about")}</Label>
                  <Input
                    {...register("about")}
                    placeholder={t("aboutPlaceholder")}
                  />
                </div>

                {/* ✅ Financial Details */}
                <h3 className="text-lg font-semibold">{t("financialInfo")}</h3>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("headcount")}
                  </Label>
                  <Input
                    {...register("company_finance.headcount")}
                    type="number"
                    placeholder={t("headcountPlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("fyPeriod")}
                  </Label>
                  <Input
                    {...register("company_finance.fy_period")}
                    placeholder={t("fyPeriodPlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("currency")}
                  </Label>
                  <Input
                    {...register("company_finance.currency")}
                    placeholder={t("currencyPlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("revenue")}
                  </Label>
                  <Input
                    {...register("company_finance.revenue")}
                    type="number"
                    placeholder={t("revenuePlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("operatingProfit")}
                  </Label>
                  <Input
                    {...register("company_finance.operating_profit")}
                    type="number"
                    placeholder={t("operatingProfitPlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("netProfit")}
                  </Label>
                  <Input
                    {...register("company_finance.net_profit")}
                    type="number"
                    placeholder={t("netProfitPlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">{t("ebitda")}</Label>
                  <Input
                    {...register("company_finance.ebitda")}
                    type="number"
                    placeholder={t("ebitdaPlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("totalAssets")}
                  </Label>
                  <Input
                    {...register("company_finance.total_assets")}
                    type="number"
                    placeholder={t("totalAssetsPlaceholder")}
                  />
                </div>

                {/* ✅ Location Details */}
                <h3 className="text-lg font-semibold">{t("location")}</h3>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("address")} <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    {...register("address")}
                    placeholder={t("addressPlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("phone")} <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    {...register("phone")}
                    placeholder={t("phonePlaceholder")}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="mt-4 w-full bg-red-500 hover:bg-red-600"
              >
                {t("addCompany")}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

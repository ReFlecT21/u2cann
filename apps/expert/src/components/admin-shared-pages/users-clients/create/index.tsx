"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@adh/ui/ui/button";
import { Card, CardContent } from "@adh/ui/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@adh/ui/ui/dialog";
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
import {
  SelectC,
  SelectContentC,
  SelectInputC,
  SelectItemC,
  SelectListC,
  SelectTriggerC,
} from "@adh/ui/ui/select-company";

import { translateText } from "~/components/translateText";
import { api } from "~/trpc/react";
import { routerPush } from "~/utils/router";

/**
 * 1) Define your form schema using zod.
 *    Include "skills" as an array of strings.
 */
const formSchema = z.object({
  isIndividual: z.enum(["individual", "corporate"], {
    required_error: "Please select an account type",
  }),
  linkedinUrl: z
    .string()
    .min(1, "LinkedIn URL is required") // Checked first
    .url("Invalid URL"), // Checked second
  companyAddress: z.string().optional(),
  industry: z.array(z.string()).optional(),
  name: z.string().min(1, "Name is required"),
  email: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  companyName: z.string().optional(),
  position: z.string().optional(),
  website: z.string().optional(),
  department: z.string().optional(),
});

/** 2) Infer the TypeScript type from the schema. */
type FormData = z.infer<typeof formSchema>;

export default function CreateIndivAccount() {
  const t = useTranslations("createClient");
  const params = useParams();
  const router = useRouter();
  const [isAccountCreated, setIsAccountCreated] = useState(false);
  const [roleSelected, setRoleSelected] = useState("individual");
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") || "" : "";

  const { data, error } =
    api.registration.client.getCorporateRegistrationDetailsForAdmin.useQuery(
      { userId },
      {
        refetchOnMount: true,
        enabled: !!userId,
      },
    );
  /** 3) Query/mutations from your TRPC API. */
  const { data: industryOptions } = api.admin.company.getIndustries.useQuery();
  const { mutateAsync: updateIndivClient } =
    api.registration.client.updateRegistrationDetailsForAdmin.useMutation();
  const { mutateAsync: updateCorpClient } =
    api.registration.client.updateCorporateRegistrationDetailsForAdmin.useMutation();
  const { mutateAsync: createIndivAccount } =
    api.registration.client.createIndividualAccountNoClerk.useMutation();
  const { mutateAsync: createCorpAccount } =
    api.registration.client.createCorporateAccountNoClerk.useMutation();
  const { mutateAsync: cancelRegistrationForAdmin } =
    api.registration.client.cancelRegistrationForAdmin.useMutation();
  const [searchQuery, setSearchQuery] = useState(""); // Stores user input
  const { data: companies } = api.user.project.searchCompanies.useQuery(
    { query: searchQuery },
    { enabled: !!searchQuery }, // Ensures it only runs when there is input
  );
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  /**
   * 4) Optional: translate categories and subcategories if locale is "jp".
   */
  const locale = Array.isArray(params?.language)
    ? params.language[0]
    : params?.language || "en";
  const [translatedIndustry, setTranslatedIndustry] = useState<Record<
    string,
    string[]
  > | null>(null);

  useEffect(() => {
    const translateIndustries = async () => {
      if (locale === "jp" && industryOptions) {
        const translated = await Promise.all(
          Object.entries(industryOptions).map(
            async ([category, subcategories]) => {
              const translatedCategory = await translateText(category, "ja");
              const translatedSubcategories = await Promise.all(
                subcategories.map((sub) => translateText(sub, "ja")),
              );
              return [translatedCategory, translatedSubcategories];
            },
          ),
        );
        setTranslatedIndustry(Object.fromEntries(translated));
      } else {
        setTranslatedIndustry(industryOptions ?? null);
      }
    };
    translateIndustries();
  }, [industryOptions, locale]);

  /**
   * 5) Set up `useForm` with zodResolver and the formSchema.
   */
  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isIndividual: "individual",
      linkedinUrl: "",
      name: "",
      email: "",
      companyAddress: "",
      position: "",
      companyName: "",
      website: "",
      department: "",
    },
  });

  const [loading, setLoading] = useState(false);

  async function onCreateAccount(formValues: FormData) {
    setLoading(true);
    try {
      let userIdFromBackend: string;
      if (formValues.isIndividual === "individual") {
        userIdFromBackend = (await createIndivAccount({
          email: formValues.email ?? "",
        })) as string;
        localStorage.setItem("role", "individual");
        localStorage.setItem("userId", userIdFromBackend);
      } else {
        setRoleSelected("corporate");
        userIdFromBackend = (await createCorpAccount({
          email: formValues.email ?? "",
        })) as string;
        localStorage.setItem("role", "corporate");
        localStorage.setItem("userId", userIdFromBackend);
      }
      localStorage.setItem("accountCreated", "true");
      setIsAccountCreated(true); // ✅ show rest of the form after
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }
  async function onSubmit(formValues: FormData) {
    setLoading(true);
    if (roleSelected === "individual") {
      const userId = localStorage.getItem("userId");
      try {
        await updateIndivClient({
          userId: userId ?? "",
          name: formValues.name ?? "",
          linkedIn: formValues.linkedinUrl ?? "",
          title: formValues.position ?? "",
          companyName: formValues.companyName ?? "",
          companyWebsite: formValues.website ?? "",
          companyIndustry: formValues.industry ?? [],
          companyAddress: formValues.companyAddress ?? "",
        });
        toast.success("Individual Client profile updated successfully!");
        setIsAccountCreated(false);
        localStorage.removeItem("accountCreated");
        localStorage.removeItem("userId");
        localStorage.removeItem("role");
        reset();
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const userId = localStorage.getItem("userId");

        await updateCorpClient({
          userId: userId ?? "",
          linkedIn: formValues.linkedinUrl ?? "",
          name: formValues.name ?? "",
          companyName: formValues.companyName ?? "",
          department: formValues.department ?? "",
          title: formValues.position ?? "",
        });
        toast.success("Corporate Client profile updated successfully!");
        setIsAccountCreated(false);
        localStorage.removeItem("accountCreated");
        localStorage.removeItem("userId");
        localStorage.removeItem("role");
        reset();
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
  }

  // Helper to format date
  function formatDate(dateStr: string | undefined) {
    if (!dateStr) return t("notStated");
    if (dateStr.toLowerCase().includes("present")) {
      return t("present");
    }
    const [month, year] = dateStr.split("-");
    return `${new Date(`${year}-${month}-01`).toLocaleString("en-US", {
      month: "short",
    })} ${year}`;
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  /**
   * 7) Return the form with all fields (linkedinUrl, address, about, industry, skills, etc.).
   */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h1 className="text-lg font-semibold">{t("title")}</h1>
      {isClient && localStorage.getItem("accountCreated") !== "true" && (
        <>
          {/* Account Type and Email Card */}
          <Card className="mt-4">
            <CardContent className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="individual"
                      {...register("isIndividual", {
                        required: "Please select an account type",
                      })}
                    />
                    {t("individual")}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="corporate"
                      {...register("isIndividual", {
                        required: "Please select an account type",
                      })}
                    />
                    {t("corporate")}
                  </label>
                </div>
                {errors.isIndividual && (
                  <p className="text-sm text-red-500">
                    {errors.isIndividual.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t("email")}</Label>
                <Input {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Button
                  className="mr-4 bg-red-500 text-white hover:bg-red-600"
                  onClick={() => {
                    const formValues = getValues();
                    onCreateAccount(formValues);
                  }}
                >
                  {t("createAccount")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      {isClient && localStorage.getItem("accountCreated") === "true" ? (
        localStorage.getItem("role") === "individual" ? (
          <>
            <Card className="mt-4">
              <CardContent className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold">{t("name")}</h2>
                    <Input {...register("name")} value={getValues("name")} />
                    {errors.name && (
                      <p className="text-sm text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{t("linkedin")}</h2>
                    <Input {...register("linkedinUrl")} />
                    {errors.name && (
                      <p className="text-sm text-red-500">
                        {errors.linkedinUrl?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">
                      {t("companyName")}
                    </h2>
                    <Input {...register("companyName")} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{t("position")}</h2>
                    <Input {...register("position")} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{t("website")}</h2>
                    <Input {...register("website")} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{t("industry")}</h2>
                    <Controller
                      name="industry"
                      control={control}
                      render={({
                        field,
                      }: {
                        field: {
                          value: string[] | undefined;
                          onChange: (value: string[]) => void;
                        };
                      }) => (
                        <MultiSelector
                          values={field.value ?? []}
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
                              {Object.entries(
                                translatedIndustry ?? industryOptions ?? {},
                              ).map(([category, subcategories]) =>
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
                  <div>
                    <h2 className="text-sm font-semibold">
                      {t("companyAddress")}
                    </h2>
                    <Input {...register("companyAddress")} />
                    {errors.name && (
                      <p className="text-sm text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Submit Button */}
            <div>
              <Button
                className="mr-4 bg-red-500 text-white hover:bg-red-600"
                onClick={async () => {
                  const userId = localStorage.getItem("userId");
                  try {
                    if (userId) {
                      await cancelRegistrationForAdmin({ userId });
                    } else {
                      toast.error("User ID not found in local storage.");
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to cancel registration.");
                  } finally {
                    localStorage.removeItem("accountCreated");
                    localStorage.removeItem("userId");
                    window.location.reload();
                  }
                }}
              >
                {t("cancelRegistration")}
              </Button>
              <Button
                className="mr-4 bg-red-500 text-white hover:bg-red-600"
                type="submit"
              >
                {t("submitForm")}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Industry MultiSelector */}
            <Card className="mt-4">
              <CardContent className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold">{t("name")}</h2>
                    <Input
                      {...register("name")}
                      onChange={(e) => {
                        localStorage.setItem("name", e.target.value);
                        return e;
                      }}
                      value={localStorage.getItem("name") || ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{t("linkedin")}</h2>
                    <Input
                      {...register("linkedinUrl")}
                      onChange={(e) => {
                        localStorage.setItem("linkedinUrl", e.target.value);
                        return e;
                      }}
                      value={localStorage.getItem("linkedinUrl") || ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">
                        {errors.linkedinUrl?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Controller
                      name="companyName"
                      control={control}
                      render={({
                        field,
                      }: {
                        field: {
                          value: string;
                          onChange: (value: string) => void;
                        };
                      }) => (
                        <div className="w-full bg-white text-black dark:bg-gray-800 dark:text-white">
                          <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold">
                              {t("companyName")}
                            </h2>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => router.push("create/add-company")} // You can replace this with actual logic later
                            >
                              Add Company
                            </Button>
                          </div>
                          <SelectC
                            value={
                              data?.companyName && data.companyName !== ""
                                ? data.companyName
                                : field.value
                            }
                            onValueChange={field.onChange}
                            className="w-full"
                          >
                            <SelectTriggerC setSearchQuery={setSearchQuery}>
                              <SelectInputC
                                placeholder={t("selectCompanyPlaceholder")}
                                setSearchQuery={setSearchQuery} // Pass the setSearchQuery function
                              />
                            </SelectTriggerC>
                            <>
                              <SelectContentC>
                                <SelectListC>
                                  {companies?.map((option) => {
                                    console.log("optionid", option.id);
                                    console.log("optionvalue", option.name);

                                    return (
                                      <SelectItemC
                                        key={option.id}
                                        value={option.name}
                                      >
                                        {option.name}
                                      </SelectItemC>
                                    );
                                  })}
                                </SelectListC>
                              </SelectContentC>
                            </>
                          </SelectC>
                          {errors.companyName && (
                            <p className="text-sm text-red-500">
                              {errors.companyName.message as string}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{t("department")}</h2>
                    <Input
                      {...register("department")}
                      onChange={(e) => {
                        localStorage.setItem("department", e.target.value);
                        return e;
                      }}
                      value={localStorage.getItem("department") || ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">
                        {errors.linkedinUrl?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{t("position")}</h2>
                    <Input
                      {...register("position")}
                      onChange={(e) => {
                        localStorage.setItem("position", e.target.value);
                        return e;
                      }}
                      value={localStorage.getItem("position") || ""}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Submit Button */}
            <div>
              <Button
                className="mr-4 bg-red-500 text-white hover:bg-red-600"
                onClick={async () => {
                  const userId = localStorage.getItem("userId");
                  try {
                    if (userId) {
                      await cancelRegistrationForAdmin({ userId });
                    } else {
                      toast.error("User ID not found in local storage.");
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to cancel registration.");
                  } finally {
                    localStorage.removeItem("accountCreated");
                    localStorage.removeItem("userId");
                    window.location.reload();
                  }
                }}
              >
                {t("cancelRegistration")}
              </Button>
              <Button
                className="mr-4 bg-red-500 text-white hover:bg-red-600"
                type="submit"
              >
                {t("submitForm")}
              </Button>
            </div>
          </>
        )
      ) : null}
    </form>
  );
}

interface Experience {
  position: string;
  companyName: string;
  country: string;
  start: string;
  end: string;
}
const experienceSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  country: z.string().min(1, "Country is required"),
  start: z
    .string()
    .regex(/^(0[1-9]|1[0-2])-\d{4}$/, "Start date must be in MM-YYYY format"),
  end: z
    .string()
    .regex(/^(0[1-9]|1[0-2])-\d{4}$/, "End date must be in MM-YYYY format"),
});
type ExperienceFormValues = z.infer<typeof experienceSchema>;
// Add Experience Dialog + Logic
export function JobExperienceTabDialogAdmin({
  data,
  onSave,
}: {
  data: Experience[];
  onSave: (data: Experience[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("expertProfileUpdateExperience");
  // Removed unused mutateAsync import as it's no longer needed.
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      companyName: "",
      position: "",
      country: "",
      start: formatDate(new Date()),
      end: formatDate(new Date()),
    },
  });

  function formatDate(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = date.getFullYear();
    return `${month}-${year}`;
  }

  const onSubmit = async (newData: ExperienceFormValues) => {
    try {
      onSave([...data, newData]);
      reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        className="w-full"
        variant="secondary"
        onClick={() => setIsOpen(true)}
      >
        {t("addExperience")}
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{t("addExperience")}</DialogTitle>
            <DialogDescription>{t("formSubtitle")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">
                  {t("companyName")}
                </Label>
                <Controller
                  name="companyName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder={t("companyNamePlaceholder")}
                      {...field}
                    />
                  )}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-500">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600">{t("position")}</Label>
                <Controller
                  name="position"
                  control={control}
                  render={({ field }) => (
                    <Input placeholder={t("positionPlaceholder")} {...field} />
                  )}
                />
                {errors.position && (
                  <p className="text-sm text-red-500">
                    {errors.position.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600">{t("country")}</Label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Input placeholder={t("countryPlaceholder")} {...field} />
                  )}
                />
                {errors.country && (
                  <p className="text-sm text-red-500">
                    {errors.country.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600">
                  {t("startDate")}
                </Label>
                <Controller
                  name="start"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder={t("datePlaceholder")}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
                {errors.start && (
                  <p className="text-sm text-red-500">{errors.start.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600">{t("endDate")}</Label>
                <Controller
                  name="end"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder={t("datePlaceholder")}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
                {errors.end && (
                  <p className="text-sm text-red-500">{errors.end.message}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("adding") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

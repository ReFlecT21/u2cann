"use client";

import exp from "constants";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { set, z } from "zod";

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
import { Textarea } from "@adh/ui/ui/text-area";

import BadgeInput from "~/components/BadgeInput";
import { translateText } from "~/components/translateText";
import { api } from "~/trpc/react";
import { routerPush } from "~/utils/router";

/**
 * 1) Define your form schema using zod.
 *    Include "skills" as an array of strings.
 */
const formSchema = z.object({
  linkedinUrl: z
    .string()
    .min(1, "LinkedIn URL is required") // Checked first
    .url("Invalid URL"), // Checked second
  address: z.string().optional(),
  about: z.string().optional(),
  industry: z.array(z.string()).optional(),
  name: z.string().min(1, "Name is required"),
  email: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  skills: z.array(z.string()).optional(), // Add the skills field
  experiences: z
    .array(
      z.object({
        companyName: z.string().optional(),
        position: z.string().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
        country: z.string().optional(),
      }),
    )
    .optional(),
});

/** 2) Infer the TypeScript type from the schema. */
type FormData = z.infer<typeof formSchema>;

export default function ExpertCreateAccountPage() {
  const t = useTranslations("importExpert");
  const params = useParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  /** 3) Query/mutations from your TRPC API. */
  const { data: industryOptions } = api.admin.company.getIndustries.useQuery();
  const { mutateAsync: updateExpertDetails } =
    api.registration.expert.updateAllRegistrationDetails.useMutation({});
  const { mutateAsync: createExpertAccount } =
    api.registration.expert.createExpertAccountWithoutClerk.useMutation();

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
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      linkedinUrl: "",
      name: "",
      email: "",
      address: "",
      about: "",
      skills: [], // Include skills here
      experiences: [],
    },
  });

  const [loading, setLoading] = useState(false);

  /**
   * 6) Combine LinkedIn account creation and TRPC calls in one onSubmit.
   */
  // Define the mutation at the top level
  const { mutateAsync: syncLinkedinForUser } =
    api.expert.linkedin.syncLinkedinForUser.useMutation({
      onSuccess: () => {
        toast.success("Success!");
      },
      onError: () => {
        toast.error("Error!");
      },
    });
  async function onSyncLinkedin(formValues: FormData) {
    setLoading(true);
    console.log("Form Values:", formValues);
    try {
      const userIdFromBackend = (await createExpertAccount()) as string;
      setUserId(userIdFromBackend);

      // If user has provided a LinkedIn URL, sync it
      if (formValues.linkedinUrl && formValues.linkedinUrl.length !== 0) {
        const linkedinData = await syncLinkedinForUser({
          url: formValues.linkedinUrl,
          userId: userIdFromBackend ?? "",
        });

        console.log("hello", linkedinData);

        // setValue("linkedinUrl", formValues.linkedinUrl);
        setValue("name", linkedinData?.name);
        setValue("address", linkedinData?.address);
        setValue("about", linkedinData?.about);
        setValue("skills", linkedinData?.skills);

        setValue("experiences", linkedinData?.experiences);
      } else {
        toast.error(t("error"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }
  async function onSubmit(formValues: FormData) {
    setLoading(true);
    if (!userId) {
      const userIdFromBackend = (await createExpertAccount()) as string;
      setUserId(userIdFromBackend);
      try {
        await updateExpertDetails({
          userId: userIdFromBackend ?? "",
          linkedIn: formValues.linkedinUrl ?? "",
          address: formValues.address ?? "",
          name: formValues.name ?? "",
          about: formValues.about ?? "",
          experiences: formValues.experiences ?? [],
          skills: formValues.skills ?? [],
          industry: formValues.industry ?? [],
        });
        toast.success("Expert profile updated successfully!");
        reset();
        setUserId(null);
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        await updateExpertDetails({
          userId: userId ?? "",
          linkedIn: formValues.linkedinUrl ?? "",
          address: formValues.address ?? "",
          name: formValues.name ?? "",
          about: formValues.about ?? "",
          experiences: formValues.experiences ?? [],
          skills: formValues.skills ?? [],
          industry: formValues.industry ?? [],
        });
        toast.success("Expert profile updated successfully!");
        reset();
        setUserId(null);
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

      {/* LinkedIn URL */}
      <div className="space-y-2 text-start">
        <Label>{t("label")}</Label>
        <Input placeholder={t("placeholder")} {...register("linkedinUrl")} />
        {errors.linkedinUrl && (
          <p className="text-sm text-red-500">{errors.linkedinUrl.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <Button
          className="mr-4 bg-red-500 text-white hover:bg-red-600"
          onClick={() => {
            const formValues = getValues();
            onSyncLinkedin(formValues);
          }}
        >
          {t("submit")}
        </Button>
      </div>

      {/* Personal Information */}
      <Card className="mt-4">
        <CardContent className="mt-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">{t("name")}</h2>
              <Input {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold">{t("email")}</h2>
              <Input {...register("email")} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{t("address")}</h2>
              <Input {...register("address")} />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold">{t("about")}</h2>
              <Textarea {...register("about")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Information */}
      <Card className="mt-4">
        <CardContent className="mt-4 text-left">
          <div className="space-y-4">
            {getValues("experiences")?.map((experience, index) => (
              <div key={index}>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div>
                      {experience.companyName}
                      <p className="text-sm text-gray-600">
                        {experience.position}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatDate(experience.start)} -{" "}
                          {formatDate(experience.end)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {experience.country}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <hr />
              </div>
            ))}
            <JobExperienceTabDialogAdmin
              data={getValues("experiences")}
              onSave={(updatedExperiences) =>
                setValue("experiences", updatedExperiences)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Industry MultiSelector */}
      <Card className="mt-4">
        <CardContent className="mt-4">
          <div className="space-y-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Skills BadgeInput */}
      <Card className="mt-4">
        <CardContent className="mt-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">{t("expertise")}</h2>
              <Controller
                name="skills"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <BadgeInput
                    value={value}
                    onSelectionChange={(newValue) => onChange(newValue)}
                    placeholder={t("skillsPlaceholder") ?? ""}
                  />
                )}
              />
              {errors.skills && (
                <p className="text-sm text-red-500">
                  {errors.skills.message as string}
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
          type="submit"
        >
          {t("submitForm")}
        </Button>
      </div>
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

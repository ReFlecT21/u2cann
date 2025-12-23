"use client";

import { ReactNode, useState } from "react";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { countries } from "country-data-list";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Prisma } from "@adh/db";
import { Button } from "@adh/ui/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@adh/ui/ui/dialog";
import { useTranslations } from "next-intl";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@adh/ui/ui/form";
import { Input } from "@adh/ui/ui/input";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@adh/ui/ui/multi-select";
import { Skeleton } from "@adh/ui/ui/skeleton";

import {
  TagSelector,
  TagSelectorInput,
  TagSelectorTrigger,
} from "~/components/TagSelector";
import { api } from "~/trpc/react";
import { TargetExpertDataType } from "./ProjectDetails";

const searchSchema = z.object({
  name: z.string(),
  about: z.string(),
  experience: z.string(),
  skills: z.string(),
  company: z.array(z.string()),
  country: z.array(z.string()),
  industry: z.array(z.string()),
});

type SearchSchema = z.infer<typeof searchSchema>;

/*
targetInfoData = {
  "expert_target_country": [
    "Ascension Island"
  ],
  "company_target": [
    "FPT INFORMATION SYSTEM CORPORATION"
  ],
  "communication_language": [
    "English"
  ],
  "keyword": {},
  "expertise": [],
  "profile": []
}
*/

export default function ProjectAddExpertDialog({
  targetInfoData,

  children,
}: {
  targetInfoData: TargetExpertDataType;

  children: ReactNode;
}) {
  const t = useTranslations("projectAddExpertDialog");
  const form = useForm<SearchSchema>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      name: "",
      about: "",
      experience: "",
      skills: "",
      company: targetInfoData.company_target,
      country: targetInfoData.expert_target_country,
      industry: [], // TODO: target industry
    },
  });

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="flex h-[95vh] min-w-[95vw] flex-col">
        <div className="flex h-full w-full gap-4 pt-4">
          <FormProvider {...form}>
            <Form {...form}>
              <SearchFilters />
            </Form>
            <ExpertsTable />
          </FormProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchFilters() {
  const form = useFormContext<SearchSchema>();
  const t = useTranslations("projectAddExpertDialog");

  // TODO: query from DB
  const industries: any[] = [];

  const resetForm = () => {
    form.setValue("name", "");
    form.setValue("about", "");
    form.setValue("experience", "");
    form.setValue("skills", "");
    form.setValue("company", []);
    form.setValue("country", []);
    form.setValue("industry", []);
  };

  return (
    <div className="flex w-[250px] flex-col gap-4">
      <Button variant="outline" onClick={resetForm}>
      {t("clear")}
      </Button>
      <div className="flex flex-col">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>	{t("search")}</FormLabel>
              <FormControl>
                <Input placeholder={t("search")} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("about")}</FormLabel>
              <FormControl>
                <Input placeholder=	{t("about")} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience</FormLabel>
              <FormControl>
                <Input placeholder={t("experience")} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("company")}</FormLabel>
              <TagSelector values={field.value} onValuesChange={field.onChange}>
                <FormControl>
                  <TagSelectorTrigger>
                    <TagSelectorInput placeholder={t("company")} />
                  </TagSelectorTrigger>
                </FormControl>
              </TagSelector>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>	{t("country")}</FormLabel>
              <MultiSelector
                values={field.value}
                onValuesChange={field.onChange}
              >
                <FormControl>
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder=	{t("country")} />
                  </MultiSelectorTrigger>
                </FormControl>
                <MultiSelectorContent>
                  <MultiSelectorList>
                    {countries.all.map((country) => (
                      <MultiSelectorItem
                        key={country.name}
                        value={country.name}
                      >
                        {country.name}
                      </MultiSelectorItem>
                    ))}
                  </MultiSelectorList>
                </MultiSelectorContent>
              </MultiSelector>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>	{t("industry")}</FormLabel>
              <MultiSelector
                values={field.value}
                onValuesChange={field.onChange}
                className="w-full"
              >
                <FormControl>
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder={t("industry")} />
                  </MultiSelectorTrigger>
                </FormControl>
                <MultiSelectorContent>
                  <MultiSelectorList>
                    {industries.map((industry) => (
                      <MultiSelectorItem
                        key={industry.name}
                        value={industry.name}
                      >
                        {industry.name}
                      </MultiSelectorItem>
                    ))}
                  </MultiSelectorList>
                </MultiSelectorContent>
              </MultiSelector>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>	{t("skills")}</FormLabel>
              <FormControl>
                <Input placeholder={t("skills")} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function ExpertsTable() {
  const { projectId } = useParams();

  const form = useFormContext<SearchSchema>();

  const search = form.watch();

  // TODO: debounce search
  const { data: experts } = api.admin.expert.searchExperts.useQuery({
    projectId: projectId as string,
    name: search.name,
    about: search.about,
    experience: search.experience,
    company: search.company,
    country: search.country,
    industry: search.industry,
    skills: search.skills,
  });

  if (experts === undefined) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-scroll p-2">
      {experts?.map((expert) => <ExpertRow key={expert.id} expert={expert} />)}
    </div>
  );
}

function ExpertRow({
  expert,
}: {
  expert: Prisma.Prisma.expertsGetPayload<{ include: { users: true } }>;
}) {
  const { projectId } = useParams();

  const utils = api.useUtils();
  const t = useTranslations("projectAddExpertDialog");

  const { mutateAsync: addExpert, isPending } =
    api.admin.project.addExpert.useMutation({
      onSuccess: async () => {
        toast.success(t("addSuccess"));
        await utils.admin.expert.searchExperts.invalidate();
        await utils.admin.project.showInfo.invalidate();
      },
      onError: () => {
        toast.error(t("addFail"));
      },
    });

  const onClick = async () => {
    await addExpert({
      projectId: projectId as string,
      expertId: expert.id,
    });
  };

  return (
    <div
      key={expert.id}
      className="flex items-center justify-between rounded-lg border p-4"
    >
      <div className="flex items-center gap-8">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-muted">
          {expert.users?.img_url && (
            <img
              src={expert.users?.img_url}
              alt={expert.users?.img_url}
              className="object-fill"
            />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <text className="font-bold">{expert.users?.name}</text>
          <text className="text-sm text-muted-foreground">
            {(expert.experiences as any[])
              .map(
                (experience) =>
                  `${experience.position}@${experience.companyName}`,
              )
              .join(" | ")}
          </text>
          <text className="text-sm text-muted-foreground">
            {expert.country}
          </text>
          <a
            href={expert.users?.linkedIn_url ?? ""}
            target="_blank"
            className="text-sm text-muted-foreground underline"
          >
            {expert.users?.linkedIn_url ?? "N/A"}
          </a>
        </div>
      </div>
      <Button onClick={onClick} disabled={isPending} variant="outline">
      {t("add")}
      </Button>
    </div>
  );
}

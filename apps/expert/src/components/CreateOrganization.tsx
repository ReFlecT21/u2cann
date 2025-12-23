"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useTranslations } from "next-intl";

import { Button } from "@adh/ui/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@adh/ui/ui/form";
import { Input } from "@adh/ui/ui/input";

import { api } from "~/trpc/react";
import { createOrganizationSchema } from "~/types/clerk";

export function CreateOrganization() {
  const { user } = useUser();
  const t = useTranslations("createOrganization");
  const [currentOrg, setCurrentOrg] = useState<{
    id: string;
    name: string;
    imageUrl: string;
  } | null>(null);

  useEffect(() => {
    const organizations = user?.organizationMemberships.map((org) => ({
      id: org.organization.id,
      name: org.organization.name,
      imageUrl: org.organization.imageUrl,
    }));
    setCurrentOrg(organizations?.at(0) ?? null);
  }, [user]);

  const form = useForm<z.infer<typeof createOrganizationSchema>>({
    resolver: zodResolver(createOrganizationSchema),
  });

  const { mutateAsync: createOrganization } =
    api.system.clerk.createOrganization.useMutation({
      onSuccess: () => {
        toast.success(t("success"));
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  async function onSubmit(values: z.infer<typeof createOrganizationSchema>) {
    try {
      console.log(values);
      await createOrganization(values);
    } catch (error) {
      console.error("Form submission error", error);
      toast.error(t("fail"));
    }
  }

  if (currentOrg) {
    return <div>{t("already")}: {currentOrg.name}</div>;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-3xl space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="text-start">
              <FormLabel>{t("nameLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("namePlaceholder")} type="text" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem className="text-start">
              <FormLabel>{t("slugLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("slugPlaceholder")} type="text" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{t("submit")}</Button>
      </form>
    </Form>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { GoogleMapsScript } from "~/components/GoogleMapsScript";

import { api } from "~/trpc/react";
import { DataTable } from "~/components/ProjectDataTableExpertList";
import { Button } from "@adh/ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adh/ui/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@adh/ui/ui/form";
import { Input } from "@adh/ui/ui/input";
import { getColumns } from "./columns";
import { AddressAutocompleteSimple } from "~/components/AddressAutocompleteSimple";

const formSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

import { AdminGuard } from "../components/AdminGuard";

export default function BranchesPage() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("branchesPage");
  const utils = api.useUtils();
  const { data = [], isLoading } = api.user.branches.getAllBranches.useQuery();
  const columns = getColumns();
  const { data: teamId } = api.user.account.getUserTeamId.useQuery();

  const createMutation = api.user.branches.createBranch.useMutation({
    onSuccess: () => {
      utils.user.branches.getAllBranches.invalidate();
      toast.success("Branch added.");
      setOpen(false);
      form.reset();
    },
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      latitude: undefined,
      longitude: undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!teamId) return toast.error("Team ID not found.");
    createMutation.mutate(values);
  };

  return (
    <AdminGuard>
      <GoogleMapsScript />
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-between pt-6 pb-2">
          <div>
            <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
            <p className="text-white-200">
              {t("pageSubtitle", { count: data.length })}
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="space-x-2 text-white bg-red-500 hover:bg-red-600">
                {t("addBranch")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("addBranch")}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("name")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("location")}</FormLabel>
                        <FormControl>
                          <AddressAutocompleteSimple
                            value={field.value}
                            onChange={field.onChange}
                            onPlaceSelect={(place) => {
                              form.setValue("location", place.address);
                              form.setValue("latitude", place.latitude);
                              form.setValue("longitude", place.longitude);
                            }}
                            placeholder="Enter address or postal code (e.g., 537643)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">{t("submit")}</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable columns={columns} data={data} isLoading={isLoading} />
      </div>
    </AdminGuard>
  );
}

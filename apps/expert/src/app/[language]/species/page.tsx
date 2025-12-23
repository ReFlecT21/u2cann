"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Loading } from "@adh/ui/custom/Loading";
import { Button } from "@adh/ui/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@adh/ui/ui/dialog";
import { Skeleton } from "@adh/ui/ui/skeleton";
import { useState } from "react";

import { DataTable } from "~/components/ProjectDataTableExpertList";
import { api } from "~/trpc/react";
import { getColumns, searchFilterFn } from "./columns";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@adh/ui/ui/multi-select";

import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@adh/ui/ui/form";

import { AdminGuard } from "../components/AdminGuard";

export default function SpeciesPage() {
  const t = useTranslations("speciesPage");
  const { data, isLoading, error, refetch } =
    api.user.species.getSpecies.useQuery();

  const { data: hiddenSpecies } = api.user.species.getHiddenSpecies.useQuery();
  const utils = api.useUtils();
  const toggleDisplay = api.user.species.createSpecies.useMutation({
    onSuccess: () => utils.user.species.getSpecies.invalidate(),
  });

  const form = useForm<{ selectedSpecies: string[] }>({
    defaultValues: {
      selectedSpecies: [],
    },
  });

  const [open, setOpen] = useState(false);

  const columns = getColumns();

  if (isLoading) {
    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-64 h-4" />
          </div>
          <Skeleton className="w-40 h-10" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-10" />
          ))}
        </div>
      </div>
    );
  }
  if (error)
    return (
      <div>
        {t("error")}: {error.message}
      </div>
    );
  if (!data) return <div>{t("noData")}</div>;

  const handleClickSpeciesInfo = (index: number) => {
    const species = data[index];
    console.log(species);
  };

  return (
    <AdminGuard>
      <>
        <div className="flex flex-row items-center justify-between mt-4">
          <div>
            <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
            <p className="text-white-200">
              {t("pageSubtitle", { count: data.length })}
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="space-x-2 text-white bg-red-500 hover:bg-red-600">
                <Plus className="text-white" size={20} />
                <p>{t("importSpecies")}</p>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="selectedSpecies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("selectSpeciesToAdd")}</FormLabel>
                      <MultiSelector
                        values={field.value}
                        onValuesChange={field.onChange}
                      >
                        <FormControl>
                          <MultiSelectorTrigger>
                            <MultiSelectorInput
                              placeholder={t("selectSpeciesToAdd")}
                            />
                          </MultiSelectorTrigger>
                        </FormControl>
                        <MultiSelectorContent>
                          <MultiSelectorList>
                            {hiddenSpecies?.map((s) => (
                              <MultiSelectorItem key={s.id} value={s.name}>
                                {s.name}
                              </MultiSelectorItem>
                            ))}
                          </MultiSelectorList>
                        </MultiSelectorContent>
                      </MultiSelector>
                    </FormItem>
                  )}
                />
                <Button
                  className="mt-4"
                  onClick={async () => {
                    const selectedSpecies = form.getValues("selectedSpecies");
                    for (const name of selectedSpecies) {
                      await toggleDisplay.mutateAsync({ name });
                    }
                    setOpen(false);
                    form.reset();
                  }}
                >
                  {t("addSelected")}
                </Button>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={data}
            onClickFunction={(index) => handleClickSpeciesInfo(index)}
            filterFn={searchFilterFn}
          />
        </div>
      </>
    </AdminGuard>
  );
}

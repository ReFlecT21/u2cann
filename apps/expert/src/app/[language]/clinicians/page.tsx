"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormItem,
  FormMessage,
} from "@adh/ui/ui/form";
import { DataTable } from "~/components/ProjectDataTableExpertList";

import { api } from "~/trpc/react";
import { getColumns } from "./columns";

import { Button } from "@adh/ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adh/ui/ui/dialog";
import { Input } from "@adh/ui/ui/input";
import { toast } from "sonner";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@adh/ui/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";

const formSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  userName: z.string().min(1, "User name is required"),
  email: z.string().email("Invalid email address"),
  branchId: z.string().min(1, "Branch ID is required"),
  appointmentTypes: z.array(z.string()).default([]),
  excludedSpecies: z.array(z.string()).default([]),
});

type ClinicianData = {
  id: string;
  userId: string;
  branchId: string;
  specialty: string | null;
  appointmentTypes: { id: string; name: string }[];
  species: { id: string; name: string }[];
  user: {
    name: string | null;
    email: string;
    branchName: string;
  };
  branch: {
    name: string;
  };
};
// Get team ID for new clinician

import { AdminGuard } from "../components/AdminGuard";

export default function CliniciansPage() {
  const t = useTranslations("cliniciansPage");
  const [open, setOpen] = useState(false);
  const [editingClinician, setEditingClinician] = useState<
    ClinicianData | undefined
  >(undefined);
  const [deletingClinician, setDeletingClinician] =
    useState<ClinicianData | null>(null);
  const ctx = api.useContext();

  const { data: branches = [] } = api.user.branches.getAllBranches.useQuery();
  const { data: appointmentTypes = [] } =
    api.user.appointmentTypes.getAllAppointmentTypes.useQuery();
  const { data: species = [] } = api.user.species.getSpecies.useQuery();

  const { data: clinicians } = api.user.clinicians.getAllClinicians.useQuery();
  console.log("clinicians", clinicians);

  const createClinician = api.user.clinicians.createClinician.useMutation({
    onSuccess: () => {
      toast.success(
        `${t("toast.created.title")}: ${t("toast.created.description")}`,
      );
      void ctx.user.clinicians.getAllClinicians.invalidate();
      setOpen(false);
      setEditingClinician(undefined);
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  const updateClinician = api.user.clinicians.updateClinician.useMutation({
    onSuccess: () => {
      toast.success(
        `${t("toast.updated.title")}: ${t("toast.updated.description")}`,
      );
      void ctx.user.clinicians.getAllClinicians.invalidate();
      setOpen(false);
      setEditingClinician(undefined);
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  const deleteClinician = api.user.clinicians.deleteClinician.useMutation({
    onSuccess: () => {
      toast.success(
        `${t("toast.deleted.title")}: ${t("toast.deleted.description")}`,
      );
      void ctx.user.clinicians.getAllClinicians.invalidate();
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  function onEdit(clinician: any) {
    console.log("Editing clinician:", clinician);
    setEditingClinician(clinician);
    setOpen(true);
  }

  function onDelete(id: string) {
    const item = clinicians?.find((c) => c.id === id) ?? null;
    setDeletingClinician(item);
  }

  const columns = getColumns({ onEdit, onDelete });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      userName: "",
      email: "",
      branchId: "",
      appointmentTypes: [],
      excludedSpecies: [],
    },
  });

  useEffect(() => {
    if (editingClinician) {
      form.reset({
        userName: editingClinician.user.name || "",
        email: editingClinician.user.email,
        branchId: editingClinician.branchId,
        appointmentTypes:
          editingClinician.appointmentTypes?.map((t: any) => t.id) ?? [],
        excludedSpecies: editingClinician.species?.map((s: any) => s.id) ?? [],
      });
    } else {
      form.reset({
        userName: "",
        email: "",
        branchId: "",
        appointmentTypes: [],
        excludedSpecies: [],
      });
    }
  }, [editingClinician, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (editingClinician) {
      console.log("Updating clinician with values:", values);
      updateClinician.mutate({
        id: editingClinician.id,
        userId: editingClinician.userId,
        userName: values.userName,
        email: values.email,
        branchId: values.branchId,
        appointmentTypes: values.appointmentTypes,
        excludedSpecies: values.excludedSpecies,
      });
    } else {
      console.log("Creating clinician with values:", values);
      createClinician.mutate(values);
    }
  }

  return (
    <AdminGuard>
      <>
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(open) => {
              setOpen(open);
              if (!open) setEditingClinician(undefined);
            }}
          >
            <DialogTrigger asChild>
              <Button>{t("newClinician")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingClinician ? t("editClinician") : t("newClinician")}
                </DialogTitle>
                <DialogDescription>{t("formDescription")}</DialogDescription>
              </DialogHeader>
              <FormProvider {...form}>
                <Form {...form}>
                  <form
                    id="clinician-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("email")}</FormLabel>
                          <FormControl>
                            <Input id="email" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="userName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("userName")}</FormLabel>
                          <FormControl>
                            <Input id="userName" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="branchId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("branchId")}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t("selectBranch")} />
                            </SelectTrigger>
                            <SelectContent>
                              {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                  {branch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="appointmentTypes"
                      render={({ field }) => {
                        // Create a mapping from ID to name for display
                        const selectedNames = (field.value || []).map((id) => {
                          const type = appointmentTypes.find(
                            (t) => t.id === id,
                          );
                          return type ? type.name : id;
                        });

                        return (
                          <FormItem>
                            <FormLabel>
                              {t("excludedAppointmentTypes")}
                            </FormLabel>
                            <MultiSelector
                              values={selectedNames}
                              onValuesChange={(names) => {
                                // Convert names back to IDs
                                const ids = names.map((name) => {
                                  const type = appointmentTypes.find(
                                    (t) => t.name === name,
                                  );
                                  return type ? type.id : name;
                                });
                                field.onChange(ids);
                              }}
                            >
                              <MultiSelectorTrigger>
                                <MultiSelectorInput
                                  placeholder={t("selectAppointmentTypes")}
                                />
                              </MultiSelectorTrigger>
                              <MultiSelectorContent>
                                <MultiSelectorList>
                                  {appointmentTypes.map((type) => (
                                    <MultiSelectorItem
                                      key={type.id}
                                      value={type.name}
                                    >
                                      {type.name}
                                    </MultiSelectorItem>
                                  ))}
                                </MultiSelectorList>
                              </MultiSelectorContent>
                            </MultiSelector>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="excludedSpecies"
                      render={({ field }) => {
                        // Create a mapping from ID to name for display
                        const selectedNames = (field.value || []).map((id) => {
                          const speciesItem = species.find((s) => s.id === id);
                          return speciesItem ? speciesItem.name : id;
                        });

                        return (
                          <FormItem>
                            <FormLabel>{t("excludedSpecies")}</FormLabel>
                            <MultiSelector
                              values={selectedNames}
                              onValuesChange={(names) => {
                                // Convert names back to IDs
                                const ids = names.map((name) => {
                                  const speciesItem = species.find(
                                    (s) => s.name === name,
                                  );
                                  return speciesItem ? speciesItem.id : name;
                                });
                                field.onChange(ids);
                              }}
                            >
                              <MultiSelectorTrigger>
                                <MultiSelectorInput
                                  placeholder={t("selectSpecies")}
                                />
                              </MultiSelectorTrigger>
                              <MultiSelectorContent>
                                <MultiSelectorList>
                                  {species.map((s) => (
                                    <MultiSelectorItem
                                      key={s.id}
                                      value={s.name}
                                    >
                                      {s.name}
                                    </MultiSelectorItem>
                                  ))}
                                </MultiSelectorList>
                              </MultiSelectorContent>
                            </MultiSelector>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <DialogFooter>
                      <Button
                        form="clinician-form"
                        type="submit"
                        disabled={
                          createClinician.isPending || updateClinician.isPending
                        }
                      >
                        {editingClinician ? t("update") : t("create")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </FormProvider>
            </DialogContent>
          </Dialog>
        </header>

        <div className="mt-4">
          <DataTable columns={columns} data={(clinicians as any) || []} />
        </div>
        <Dialog
          open={!!deletingClinician}
          onOpenChange={(isOpen) => !isOpen && setDeletingClinician(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("confirmDeleteTitle")}</DialogTitle>
            </DialogHeader>
            <p>
              {t("confirmDeleteMessage", {
                name: deletingClinician?.user.name || "Unknown",
              })}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeletingClinician(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deletingClinician) {
                    deleteClinician.mutate({ id: deletingClinician.id });
                    setDeletingClinician(null);
                  }
                }}
              >
                {t("confirm")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    </AdminGuard>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { api } from "~/trpc/react";
import { Skeleton } from "@adh/ui/ui/skeleton";
import { Button } from "@adh/ui/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "~/components/ProjectDataTableExpertList";
import { getColumns } from "./columns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adh/ui/ui/dialog";
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormItem,
  FormMessage,
} from "@adh/ui/ui/form";
import { Input } from "@adh/ui/ui/input";
import { Textarea } from "@adh/ui/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";
import { toast } from "sonner";
import { AppointmentTypeName } from "@adh/db";

// Helper function to convert enum value to display name
const formatAppointmentTypeName = (name: string): string => {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Get all appointment type names from the enum
const appointmentTypeNames = Object.values(AppointmentTypeName);

const formSchema = z.object({
  name: z.nativeEnum(AppointmentTypeName),
  duration: z.preprocess((val) => Number(val), z.number().min(1)),
  maxAppointmentsPerClinician: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().optional(),
  ),
  gapToEarliestSlotMinutes: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().optional(),
  ),
  description: z.string().optional(),
});

import { AdminGuard } from "../components/AdminGuard";

export default function AppointmentTypesPage() {
  const t = useTranslations("appointmentTypesPage");
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<appointmentType | null>(null);
  const [deletingItem, setDeletingItem] = useState<appointmentType | null>(
    null,
  );
  const utils = api.useUtils();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingItem?.name ?? AppointmentTypeName.consultation,
      duration: editingItem?.duration ?? 30,
      maxAppointmentsPerClinician:
        editingItem?.maxAppointmentsPerClinician ?? 1,
      gapToEarliestSlotMinutes: editingItem?.gapToEarliestSlotMinutes ?? 120,
      description: editingItem?.description ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name: editingItem?.name ?? AppointmentTypeName.consultation,
      duration: editingItem?.duration ?? 30,
      maxAppointmentsPerClinician:
        editingItem?.maxAppointmentsPerClinician ?? 1,
      gapToEarliestSlotMinutes: editingItem?.gapToEarliestSlotMinutes ?? 120,
      description: editingItem?.description ?? "",
    });
  }, [editingItem, form]);

  const { data, isLoading, error } =
    api.user.appointmentTypes.getAllAppointmentTypes.useQuery();

  const createMutation =
    api.user.appointmentTypes.createAppointmentType.useMutation({
      onSuccess: () => {
        utils.user.appointmentTypes.getAllAppointmentTypes.invalidate();
        toast.success("Appointment Type added.");
        setOpen(false);
        setEditingItem(null);
      },
      onError: () => toast.error("Failed to add appointment type."),
    });

  const updateMutation =
    api.user.appointmentTypes.updateAppointmentType.useMutation({
      onSuccess: () => {
        utils.user.appointmentTypes.getAllAppointmentTypes.invalidate();
        toast.success("Appointment Type updated.");
        setOpen(false);
        setEditingItem(null);
      },
      onError: () => toast.error("Failed to update appointment type."),
    });

  const deleteMutation =
    api.user.appointmentTypes.deleteAppointmentType.useMutation({
      onSuccess: () => {
        utils.user.appointmentTypes.getAllAppointmentTypes.invalidate();
        toast.success("Appointment Type deleted.");
        setDeletingItem(null);
      },
      onError: () => toast.error("Failed to delete appointment type."),
    });

  const columns = getColumns({
    onDelete: (id: string) => {
      const item = data.find((d) => d.id === id);
      if (item) setDeletingItem(item);
    },
    onEdit: (item: appointmentType) => {
      setEditingItem(item);
      setOpen(true);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingItem) {
      updateMutation.mutate({ ...values, id: editingItem.id });
    } else {
      createMutation.mutate(values);
    }
  };

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

  if (error) {
    return (
      <div>
        {t("error")}: {error.message}
      </div>
    );
  }

  if (!data) {
    return <div>{t("noData")}</div>;
  }

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
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                setEditingItem(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="space-x-2 text-white bg-red-500 hover:bg-red-600">
                <Plus className="text-white" size={20} />
                <p>{t("addAppointmentType")}</p>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem
                    ? t("editAppointmentType")
                    : t("addAppointmentType")}
                </DialogTitle>
              </DialogHeader>
              <FormProvider {...form}>
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
                          <FormLabel>{t("displayName")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!!editingItem}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select appointment type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {appointmentTypeNames.map((typeName) => (
                                <SelectItem key={typeName} value={typeName}>
                                  {formatAppointmentTypeName(typeName)}
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
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("duration")}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxAppointmentsPerClinician"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maxAppointmentCount")}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gapToEarliestSlotMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("gapToEarliestSlot")}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("messageToInclude")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">
                      {editingItem ? t("update") : t("submit")}
                    </Button>
                  </form>
                </Form>
              </FormProvider>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4">
          <DataTable columns={columns} data={data} />
        </div>

        <Dialog
          open={!!deletingItem}
          onOpenChange={(isOpen) => !isOpen && setDeletingItem(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("confirmDeleteTitle")}</DialogTitle>
            </DialogHeader>
            <p>{t("confirmDeleteMessage", { name: deletingItem?.name })}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingItem(null)}>
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deletingItem) {
                    deleteMutation.mutate({ id: deletingItem.id });
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

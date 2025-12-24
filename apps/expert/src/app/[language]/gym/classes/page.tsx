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
  FormDescription,
} from "@adh/ui/ui/form";
import { DataTable } from "~/components/ProjectDataTableExpertList";
import { api } from "~/trpc/react";
import { getColumns, type ClassType } from "./columns";
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
import { Textarea } from "@adh/ui/ui/text-area";
import { Switch } from "@adh/ui/ui/switch";
import { toast } from "sonner";
import { AdminGuard } from "../../components/AdminGuard";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  defaultCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  isOpenGym: z.boolean().default(false),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ClassTypesPage() {
  const t = useTranslations("classTypesPage");
  const [open, setOpen] = useState(false);
  const [editingClassType, setEditingClassType] = useState<ClassType | undefined>(undefined);
  const [deletingClassType, setDeletingClassType] = useState<ClassType | null>(null);
  const ctx = api.useContext();

  const { data: classTypes = [] } = api.gym.classTypes.getAll.useQuery();

  const createClassType = api.gym.classTypes.create.useMutation({
    onSuccess: () => {
      toast.success(`${t("toast.created.title")}: ${t("toast.created.description")}`);
      void ctx.gym.classTypes.getAll.invalidate();
      setOpen(false);
      setEditingClassType(undefined);
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  const updateClassType = api.gym.classTypes.update.useMutation({
    onSuccess: () => {
      toast.success(`${t("toast.updated.title")}: ${t("toast.updated.description")}`);
      void ctx.gym.classTypes.getAll.invalidate();
      setOpen(false);
      setEditingClassType(undefined);
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  const deleteClassType = api.gym.classTypes.delete.useMutation({
    onSuccess: () => {
      toast.success(`${t("toast.deleted.title")}: ${t("toast.deleted.description")}`);
      void ctx.gym.classTypes.getAll.invalidate();
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  function onEdit(classType: ClassType) {
    setEditingClassType(classType);
    setOpen(true);
  }

  function onDelete(id: string) {
    const item = classTypes.find((c) => c.id === id) ?? null;
    setDeletingClassType(item);
  }

  const columns = getColumns({ onEdit, onDelete });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      duration: 60,
      defaultCapacity: 12,
      isOpenGym: false,
      color: "#3B82F6",
    },
  });

  useEffect(() => {
    if (editingClassType) {
      form.reset({
        name: editingClassType.name,
        displayName: editingClassType.displayName,
        description: editingClassType.description || "",
        duration: editingClassType.duration,
        defaultCapacity: editingClassType.defaultCapacity,
        isOpenGym: editingClassType.isOpenGym,
        color: editingClassType.color || "#3B82F6",
      });
    } else {
      form.reset({
        name: "",
        displayName: "",
        description: "",
        duration: 60,
        defaultCapacity: 12,
        isOpenGym: false,
        color: "#3B82F6",
      });
    }
  }, [editingClassType, form]);

  function onSubmit(values: FormValues) {
    if (editingClassType) {
      updateClassType.mutate({
        id: editingClassType.id,
        ...values,
      });
    } else {
      createClassType.mutate(values);
    }
  }

  return (
    <AdminGuard>
      <>
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
            <p className="text-muted-foreground">
              {t("pageSubtitle", { count: classTypes.length })}
            </p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(open) => {
              setOpen(open);
              if (!open) setEditingClassType(undefined);
            }}
          >
            <DialogTrigger asChild>
              <Button>{t("addClassType")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingClassType ? t("editClassType") : t("addClassType")}
                </DialogTitle>
                <DialogDescription>
                  Configure the class type details.
                </DialogDescription>
              </DialogHeader>
              <FormProvider {...form}>
                <Form {...form}>
                  <form
                    id="class-type-form"
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
                            <Input placeholder="boxing" {...field} />
                          </FormControl>
                          <FormDescription>
                            Internal name (lowercase, no spaces)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("displayName")}</FormLabel>
                          <FormControl>
                            <Input placeholder="Boxing Class" {...field} />
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
                          <FormLabel>{t("description")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Description of the class..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("duration")}</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="defaultCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("defaultCapacity")}</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("color")}</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input type="color" className="w-12 h-10 p-1" {...field} />
                              <Input
                                type="text"
                                placeholder="#3B82F6"
                                value={field.value}
                                onChange={field.onChange}
                                className="flex-1"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isOpenGym"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{t("isOpenGym")}</FormLabel>
                            <FormDescription>
                              Mark as open gym session (self-directed training)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        form="class-type-form"
                        type="submit"
                        disabled={createClassType.isPending || updateClassType.isPending}
                      >
                        {editingClassType ? t("update") : t("submit")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </FormProvider>
            </DialogContent>
          </Dialog>
        </header>

        <div className="mt-4">
          <DataTable columns={columns} data={classTypes} />
        </div>

        <Dialog
          open={!!deletingClassType}
          onOpenChange={(isOpen) => !isOpen && setDeletingClassType(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("confirmDeleteTitle")}</DialogTitle>
            </DialogHeader>
            <p>
              {t("confirmDeleteMessage", {
                name: deletingClassType?.displayName || "Unknown",
              })}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingClassType(null)}>
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deletingClassType) {
                    deleteClassType.mutate({ id: deletingClassType.id });
                    setDeletingClassType(null);
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

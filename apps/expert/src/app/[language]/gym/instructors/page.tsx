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
import { getColumns, type Instructor } from "./columns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";
import { toast } from "sonner";
import { AdminGuard } from "../../components/AdminGuard";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  branchId: z.string().min(1, "Branch is required"),
  specialty: z.string().optional(),
  bio: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function InstructorsPage() {
  const t = useTranslations("instructorsPage");
  const [open, setOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | undefined>(undefined);
  const [deletingInstructor, setDeletingInstructor] = useState<Instructor | null>(null);
  const ctx = api.useContext();

  const { data: instructors = [] } = api.gym.instructors.getAll.useQuery();
  const { data: branches = [] } = api.user.branches.getAllBranches.useQuery();

  const createInstructor = api.gym.instructors.create.useMutation({
    onSuccess: () => {
      toast.success(`${t("toast.created.title")}: ${t("toast.created.description")}`);
      void ctx.gym.instructors.getAll.invalidate();
      setOpen(false);
      setEditingInstructor(undefined);
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  const updateInstructor = api.gym.instructors.update.useMutation({
    onSuccess: () => {
      toast.success(`${t("toast.updated.title")}: ${t("toast.updated.description")}`);
      void ctx.gym.instructors.getAll.invalidate();
      setOpen(false);
      setEditingInstructor(undefined);
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  const deleteInstructor = api.gym.instructors.delete.useMutation({
    onSuccess: () => {
      toast.success(`${t("toast.deleted.title")}: ${t("toast.deleted.description")}`);
      void ctx.gym.instructors.getAll.invalidate();
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  function onEdit(instructor: Instructor) {
    setEditingInstructor(instructor);
    setOpen(true);
  }

  function onDelete(id: string) {
    const item = instructors.find((i) => i.id === id) ?? null;
    setDeletingInstructor(item);
  }

  const columns = getColumns({ onEdit, onDelete });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      branchId: "",
      specialty: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (editingInstructor) {
      form.reset({
        name: editingInstructor.name,
        branchId: editingInstructor.branchId,
        specialty: editingInstructor.specialty || "",
        bio: editingInstructor.bio || "",
      });
    } else {
      form.reset({
        name: "",
        branchId: "",
        specialty: "",
        bio: "",
      });
    }
  }, [editingInstructor, form]);

  function onSubmit(values: FormValues) {
    if (editingInstructor) {
      updateInstructor.mutate({
        id: editingInstructor.id,
        ...values,
      });
    } else {
      createInstructor.mutate(values);
    }
  }

  return (
    <AdminGuard>
      <>
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
            <p className="text-muted-foreground">
              {t("pageSubtitle", { count: instructors.length })}
            </p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(open) => {
              setOpen(open);
              if (!open) setEditingInstructor(undefined);
            }}
          >
            <DialogTrigger asChild>
              <Button>{t("addInstructor")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingInstructor ? t("editInstructor") : t("addInstructor")}
                </DialogTitle>
                <DialogDescription>
                  Add an instructor to your gym.
                </DialogDescription>
              </DialogHeader>
              <FormProvider {...form}>
                <Form {...form}>
                  <form
                    id="instructor-form"
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
                            <Input placeholder="John Doe" {...field} />
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
                          <FormLabel>{t("branch")}</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
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
                      name="specialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("specialty")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Boxing, Muay Thai, etc."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("bio")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief bio about the instructor..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        form="instructor-form"
                        type="submit"
                        disabled={createInstructor.isPending || updateInstructor.isPending}
                      >
                        {editingInstructor ? t("update") : t("submit")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </FormProvider>
            </DialogContent>
          </Dialog>
        </header>

        <div className="mt-4">
          <DataTable columns={columns} data={instructors} />
        </div>

        <Dialog
          open={!!deletingInstructor}
          onOpenChange={(isOpen) => !isOpen && setDeletingInstructor(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("confirmDeleteTitle")}</DialogTitle>
            </DialogHeader>
            <p>
              {t("confirmDeleteMessage", {
                name: deletingInstructor?.name || "Unknown",
              })}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingInstructor(null)}>
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deletingInstructor) {
                    deleteInstructor.mutate({ id: deletingInstructor.id });
                    setDeletingInstructor(null);
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

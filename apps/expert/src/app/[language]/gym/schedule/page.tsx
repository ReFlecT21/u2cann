"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormItem,
  FormMessage,
} from "@adh/ui/ui/form";
import { api } from "~/trpc/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@adh/ui/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@adh/ui/ui/card";
import { Badge } from "@adh/ui/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, Users, Plus, Wand2 } from "lucide-react";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const templateFormSchema = z.object({
  classTypeId: z.string().min(1, "Class type is required"),
  instructorId: z.string().min(1, "Instructor is required"),
  branchId: z.string().min(1, "Branch is required"),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

const generateFormSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  branchId: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;
type GenerateFormValues = z.infer<typeof generateFormSchema>;

export default function SchedulePage() {
  const t = useTranslations("schedulePage");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const ctx = api.useContext();

  // Fetch data
  const { data: templates = [] } = api.gym.templates.getAll.useQuery();
  const { data: sessions = [] } = api.gym.sessions.getAll.useQuery({
    startDate: startOfWeek(new Date()),
    endDate: addDays(endOfWeek(new Date()), 7),
  });
  const { data: classTypes = [] } = api.gym.classTypes.getAll.useQuery();
  const { data: instructors = [] } = api.gym.instructors.getAll.useQuery();
  const { data: branches = [] } = api.user.branches.getAllBranches.useQuery();

  // Mutations
  const createTemplate = api.gym.templates.create.useMutation({
    onSuccess: () => {
      toast.success(`${t("toast.created.title")}: ${t("toast.created.description")}`);
      void ctx.gym.templates.getAll.invalidate();
      setTemplateDialogOpen(false);
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  const deleteTemplate = api.gym.templates.delete.useMutation({
    onSuccess: () => {
      toast.success(`${t("toast.deleted.title")}: ${t("toast.deleted.description")}`);
      void ctx.gym.templates.getAll.invalidate();
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  const generateSessions = api.gym.sessions.generateFromTemplates.useMutation({
    onSuccess: (result) => {
      toast.success(
        `${t("toast.generated.title")}: ${t("toast.generated.description", { count: result.created })}`
      );
      void ctx.gym.sessions.getAll.invalidate();
      setGenerateDialogOpen(false);
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  const cancelSession = api.gym.sessions.cancel.useMutation({
    onSuccess: () => {
      toast.success("Session cancelled");
      void ctx.gym.sessions.getAll.invalidate();
    },
    onError: () => {
      toast.error(`${t("toast.error.title")}: ${t("toast.error.description")}`);
    },
  });

  // Forms
  const templateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      classTypeId: "",
      instructorId: "",
      branchId: "",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      capacity: 12,
    },
  });

  const generateForm = useForm<GenerateFormValues>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      branchId: "",
    },
  });

  function onTemplateSubmit(values: TemplateFormValues) {
    createTemplate.mutate({
      ...values,
      isActive: true,
    });
  }

  function onGenerateSubmit(values: GenerateFormValues) {
    generateSessions.mutate({
      startDate: new Date(values.startDate),
      endDate: new Date(values.endDate),
      branchId: values.branchId || undefined,
    });
  }

  // Group templates by day
  const templatesByDay: Record<number, typeof templates> = {};
  for (let i = 0; i < 7; i++) {
    templatesByDay[i] = templates.filter((t) => t.dayOfWeek === i);
  }

  return (
    <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
            <p className="text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Wand2 className="mr-2 h-4 w-4" />
                  {t("sessions.generateSessions")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("sessions.generateSessions")}</DialogTitle>
                  <DialogDescription>
                    Generate sessions from your templates for a date range.
                  </DialogDescription>
                </DialogHeader>
                <FormProvider {...generateForm}>
                  <Form {...generateForm}>
                    <form
                      id="generate-form"
                      onSubmit={generateForm.handleSubmit(onGenerateSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={generateForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("sessions.startDate")}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={generateForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("sessions.endDate")}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={generateForm.control}
                        name="branchId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("sessions.branch")} (Optional)</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="All branches" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">All branches</SelectItem>
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
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={generateSessions.isPending}
                        >
                          {t("sessions.generate")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </FormProvider>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList>
            <TabsTrigger value="templates">{t("tabs.templates")}</TabsTrigger>
            <TabsTrigger value="sessions">{t("tabs.sessions")}</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("templates.addTemplate")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("templates.addTemplate")}</DialogTitle>
                    <DialogDescription>
                      Create a recurring weekly class template.
                    </DialogDescription>
                  </DialogHeader>
                  <FormProvider {...templateForm}>
                    <Form {...templateForm}>
                      <form
                        id="template-form"
                        onSubmit={templateForm.handleSubmit(onTemplateSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={templateForm.control}
                          name="classTypeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("sessions.classType")}</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {classTypes.map((ct) => (
                                    <SelectItem key={ct.id} value={ct.id}>
                                      {ct.displayName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={templateForm.control}
                          name="instructorId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("sessions.instructor")}</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select instructor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {instructors.map((inst) => (
                                    <SelectItem key={inst.id} value={inst.id}>
                                      {inst.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={templateForm.control}
                          name="branchId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("sessions.branch")}</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select branch" />
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
                          control={templateForm.control}
                          name="dayOfWeek"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("templates.dayOfWeek")}</FormLabel>
                              <Select
                                value={String(field.value)}
                                onValueChange={(v) => field.onChange(Number(v))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DAYS_OF_WEEK.map((day, i) => (
                                    <SelectItem key={i} value={String(i)}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={templateForm.control}
                            name="startTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("sessions.startTime")}</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={templateForm.control}
                            name="endTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("sessions.endTime")}</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={templateForm.control}
                          name="capacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("sessions.capacity")}</FormLabel>
                              <FormControl>
                                <Input type="number" min={1} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={createTemplate.isPending}>
                            {t("submit")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </FormProvider>
                </DialogContent>
              </Dialog>
            </div>

            {/* Weekly template grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {DAYS_OF_WEEK.map((day, dayIndex) => (
                <Card key={dayIndex}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">{day}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {templatesByDay[dayIndex]?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No templates</p>
                    ) : (
                      templatesByDay[dayIndex]?.map((template) => (
                        <div
                          key={template.id}
                          className="rounded-md border p-2 text-sm space-y-1"
                          style={{
                            borderLeftWidth: 3,
                            borderLeftColor: template.classType?.color || "#3B82F6",
                          }}
                        >
                          <div className="font-medium">
                            {template.classType?.displayName}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {template.startTime} - {template.endTime}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {template.capacity} spots
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {template.instructor?.name}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-1 h-7 text-destructive"
                            onClick={() => deleteTemplate.mutate({ id: template.id })}
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <div className="grid gap-4">
              {sessions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No sessions found. Generate sessions from templates or create them
                    manually.
                  </CardContent>
                </Card>
              ) : (
                sessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-1 h-12 rounded"
                            style={{
                              backgroundColor: session.classType?.color || "#3B82F6",
                            }}
                          />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {session.classType?.displayName}
                              {session.isCancelled && (
                                <Badge variant="destructive">Cancelled</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(session.startTime), "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(session.startTime), "h:mm a")} -{" "}
                                {format(new Date(session.endTime), "h:mm a")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {session.bookedCount}/{session.capacity}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {session.instructor?.name} at {session.branch?.name}
                            </div>
                          </div>
                        </div>
                        {!session.isCancelled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              cancelSession.mutate({ id: session.id })
                            }
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}

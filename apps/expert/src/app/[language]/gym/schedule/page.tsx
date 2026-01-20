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
import { Calendar, Clock, Users, Plus, Wand2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@adh/ui";

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
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

const generateFormSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;
type GenerateFormValues = z.infer<typeof generateFormSchema>;

// Helper to get Monday of a week
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SchedulePage() {
  const t = useTranslations("schedulePage");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const ctx = api.useContext();

  // Calculate week end (Sunday)
  const weekEnd = addDays(weekStart, 6);

  // Fetch data
  const { data: templates = [] } = api.gym.templates.getAll.useQuery();
  const { data: sessions = [] } = api.gym.sessions.getAll.useQuery({
    startDate: weekStart,
    endDate: addDays(weekEnd, 1), // Include full Sunday
  });
  const { data: classTypes = [] } = api.gym.classTypes.getAll.useQuery();
  const { data: instructors = [] } = api.gym.instructors.getAll.useQuery();

  // Week navigation
  const handlePreviousWeek = () => {
    setWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => addDays(prev, 7));
  };

  // Group sessions by day of week
  const sessionsByDay: Record<number, typeof sessions> = {};
  for (let i = 0; i < 7; i++) {
    sessionsByDay[i] = [];
  }
  for (const session of sessions) {
    if (!session.isCancelled) {
      const dayOfWeek = new Date(session.startTime).getDay();
      if (!sessionsByDay[dayOfWeek]) {
        sessionsByDay[dayOfWeek] = [];
      }
      sessionsByDay[dayOfWeek].push(session);
    }
  }
  // Sort each day's sessions by time
  for (const day in sessionsByDay) {
    sessionsByDay[Number(day)]?.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

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
      timezoneOffset: new Date().getTimezoneOffset(), // Pass client timezone (e.g., -480 for UTC+8)
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
                              <Select value={field.value || undefined} onValueChange={field.onChange}>
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
                              <Select value={field.value || undefined} onValueChange={field.onChange}>
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
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-center">
                <h3 className="font-semibold">
                  {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                </h3>
              </div>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Weekly Sessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {DAYS_OF_WEEK.map((day, dayIndex) => {
                // Calculate the date for this day column
                const dayOffset = dayIndex === 0 ? 6 : dayIndex - 1; // Monday = 0, Sunday = 6
                const dayDate = addDays(weekStart, dayOffset);
                const daySessions = sessionsByDay[dayIndex] || [];

                return (
                  <Card key={dayIndex} className="min-h-[200px]">
                    <CardHeader className="py-3 pb-2">
                      <CardTitle className="text-sm font-medium">
                        <div>{day}</div>
                        <div className="text-xs text-muted-foreground font-normal">
                          {format(dayDate, "MMM d")}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-3 pt-0">
                      {daySessions.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No classes
                        </p>
                      ) : (
                        daySessions.map((session) => (
                          <div
                            key={session.id}
                            className={cn(
                              "rounded-md border p-2 text-sm space-y-1 transition-colors",
                              session.isCancelled && "opacity-50 bg-muted"
                            )}
                            style={{
                              borderLeftWidth: 3,
                              borderLeftColor: session.classType?.color || "#3B82F6",
                            }}
                          >
                            <div className="font-medium text-xs flex items-center gap-1">
                              {session.classType?.displayName}
                              {session.isCancelled && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                  Cancelled
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Clock className="h-3 w-3" />
                              {format(new Date(session.startTime), "h:mm a")}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground truncate max-w-[80px]">
                                {session.instructor?.name}
                              </span>
                              <Badge
                                variant={
                                  session.bookedCount >= session.capacity
                                    ? "destructive"
                                    : session.bookedCount > session.capacity * 0.8
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-[10px] px-1 py-0"
                              >
                                {session.bookedCount}/{session.capacity}
                              </Badge>
                            </div>
                            {!session.isCancelled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full mt-1 h-6 text-xs text-destructive hover:text-destructive"
                                onClick={() => cancelSession.mutate({ id: session.id })}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}

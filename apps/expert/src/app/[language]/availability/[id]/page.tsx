"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "@adh/ui/ui/button";
import { Input } from "@adh/ui/ui/input";
import { Label } from "@adh/ui/ui/label";
import { Switch } from "@adh/ui/ui/switch";
import { Skeleton } from "@adh/ui/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";
import { ArrowLeft, Trash2, Plus, Copy, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@adh/ui/ui/dialog";
import { Checkbox } from "@adh/ui/ui/checkbox";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

interface WeekSchedule {
  [key: string]: DaySchedule;
}

const timeSlotSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  timeSlots: z.array(timeSlotSchema),
});

const availabilitySchema = z.object({
  timezone: z.string(),
  isDefault: z.boolean(),
  schedule: z.object({
    Sunday: dayScheduleSchema,
    Monday: dayScheduleSchema,
    Tuesday: dayScheduleSchema,
    Wednesday: dayScheduleSchema,
    Thursday: dayScheduleSchema,
    Friday: dayScheduleSchema,
    Saturday: dayScheduleSchema,
  }),
});

type AvailabilityFormData = z.infer<typeof availabilitySchema>;

export default function Component() {
  const router = useRouter();
  const updateAvailability =
    api.user.availability.updateAvailabilityGroup.useMutation();
  const params = useParams();
  const id = params?.id as string;
  console.log("Availability ID:", id);
  const { data, isLoading } =
    api.user.availability.getAvailabilityById.useQuery({ id });
  console.log(data);

  const [setToDefault, setSetToDefault] = useState(true);
  const [formReady, setFormReady] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const defaultValues: AvailabilityFormData = {
    timezone: "Asia/Singapore",
    isDefault: false,
    schedule: {
      Sunday: {
        enabled: false,
        timeSlots: [{ id: "1", startTime: "9:00am", endTime: "5:00pm" }],
      },
      Monday: {
        enabled: true,
        timeSlots: [{ id: "1", startTime: "9:00am", endTime: "5:00pm" }],
      },
      Tuesday: {
        enabled: true,
        timeSlots: [{ id: "1", startTime: "9:00am", endTime: "5:00pm" }],
      },
      Wednesday: {
        enabled: true,
        timeSlots: [{ id: "1", startTime: "9:00am", endTime: "5:00pm" }],
      },
      Thursday: {
        enabled: true,
        timeSlots: [{ id: "1", startTime: "9:00am", endTime: "5:00pm" }],
      },
      Friday: {
        enabled: true,
        timeSlots: [{ id: "1", startTime: "9:00am", endTime: "5:00pm" }],
      },
      Saturday: {
        enabled: false,
        timeSlots: [{ id: "1", startTime: "9:00am", endTime: "5:00pm" }],
      },
    },
  };

  const methods = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues,
  });

  // Utility: Map day number to day name
  const dayNumberToName = (num: number) => {
    const names = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return names[num];
  };

  // Populate form with fetched data
  useEffect(() => {
    if (data && data.availability) {
      // Assume data.availability is an array of { dayOfWeek: number, startTime, endTime }
      const schedule: AvailabilityFormData["schedule"] = {
        Sunday: { enabled: false, timeSlots: [] },
        Monday: { enabled: false, timeSlots: [] },
        Tuesday: { enabled: false, timeSlots: [] },
        Wednesday: { enabled: false, timeSlots: [] },
        Thursday: { enabled: false, timeSlots: [] },
        Friday: { enabled: false, timeSlots: [] },
        Saturday: { enabled: false, timeSlots: [] },
      };

      // Group availability entries by day
      const dayGroups: { [key: string]: typeof data.availability } = {};
      for (const entry of data.availability) {
        const dayName = dayNumberToName(entry.dayOfWeek);
        if (dayName) {
          if (!dayGroups[dayName]) dayGroups[dayName] = [];
          dayGroups[dayName].push(entry);
        }
      }

      // Convert grouped entries to timeSlots
      for (const [dayName, entries] of Object.entries(dayGroups)) {
        if (schedule[dayName]) {
          schedule[dayName] = {
            enabled: entries.length > 0,
            timeSlots: entries.map((entry, index) => ({
              id: `${index + 1}`,
              startTime: entry.startTime,
              endTime: entry.endTime,
            })),
          };
        }
      }
      methods.reset({
        timezone: data.timezone || "Asia/Singapore",
        isDefault: data.isDefault ?? false,
        schedule,
      });
      setFormReady(true);
    }
  }, [data]);

  const { watch, setValue, handleSubmit } = methods;

  useEffect(() => {
    const subscription = methods.watch((value) => {
      console.log("Form changed:", value);
    });

    return () => subscription.unsubscribe();
  }, [methods]);

  if (isLoading || !formReady) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-32 h-6 rounded" />
              <Skeleton className="w-24 h-10 rounded" />
              <Skeleton className="w-6 h-6" />
              <Skeleton className="w-24 h-10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const schedule = watch("schedule");
  const timezone = watch("timezone");

  const toggleDay = (day: string) => {
    const current = schedule[day];
    const newEnabled = !current.enabled;
    setValue(`schedule.${day}.enabled`, newEnabled);

    // If enabling and no time slots exist, add a default one
    if (newEnabled && current.timeSlots.length === 0) {
      setValue(`schedule.${day}.timeSlots`, [
        { id: "1", startTime: "9:00am", endTime: "5:00pm" },
      ]);
    }
  };

  const updateTimeSlot = (
    day: string,
    slotIndex: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setValue(`schedule.${day}.timeSlots.${slotIndex}.${field}`, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const addTimeSlot = (day: string) => {
    const currentSlots = schedule[day].timeSlots;
    const newSlot: TimeSlot = {
      id: `${currentSlots.length + 1}`,
      startTime: "9:00am",
      endTime: "5:00pm",
    };
    setValue(`schedule.${day}.timeSlots`, [...currentSlots, newSlot]);
  };

  const removeTimeSlot = (day: string, slotIndex: number) => {
    const currentSlots = schedule[day].timeSlots;
    const newSlots = currentSlots.filter((_, index) => index !== slotIndex);
    setValue(`schedule.${day}.timeSlots`, newSlots);

    // If no time slots left, disable the day
    if (newSlots.length === 0) {
      setValue(`schedule.${day}.enabled`, false);
    }
  };

  const openCopyDialog = (day: string) => {
    setCopySourceDay(day);
    setCopyDialogOpen(true);
    // Pre-select Monday as shown in the image
    setSelectedDays(day === "Monday" ? [] : ["Monday"]);
  };

  const handleCopyTimes = () => {
    const sourceTimeSlots = schedule[copySourceDay].timeSlots;

    selectedDays.forEach((targetDay) => {
      setValue(`schedule.${targetDay}.timeSlots`, [...sourceTimeSlots]);
      setValue(`schedule.${targetDay}.enabled`, true);
    });

    setCopyDialogOpen(false);
    setSelectedDays([]);
    setCopySourceDay("");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allDays = days.filter((day) => day !== copySourceDay);
      setSelectedDays(allDays);
    } else {
      setSelectedDays([]);
    }
  };

  const handleDaySelection = (day: string, checked: boolean) => {
    if (checked) {
      setSelectedDays((prev) => [...prev, day]);
    } else {
      setSelectedDays((prev) => prev.filter((d) => d !== day));
    }
  };

  const days = Object.keys(schedule);

  const onSubmit = (formData: AvailabilityFormData) => {
    console.log("🚀 Raw schedule before transforming:", formData.schedule);

    const availability = Object.entries(formData.schedule).flatMap(
      ([day, val]) => {
        if (!val.enabled || val.timeSlots.length === 0) return [];

        return val.timeSlots.map((slot) => ({
          dayOfWeek: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ].indexOf(day),
          startTime: slot.startTime,
          endTime: slot.endTime,
        }));
      },
    );

    console.log("✅ Submitting availability:", {
      id,
      availability,
      timezone: formData.timezone,
      isDefault: formData.isDefault,
    });

    updateAvailability.mutate(
      {
        id,
        availability,
        timezone: formData.timezone,
        isDefault: formData.isDefault,
      },
      {
        onSuccess: () => {
          console.log("✅ Availability updated successfully");
        },
        onError: (err) => {
          console.error("❌ Failed to update availability:", err);
        },
      },
    );
  };

  // Helper function to generate dynamic schedule summary
  const getDynamicScheduleSummary = () => {
    const dayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const fullDays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const scheduleArray = fullDays.map((day, index) => {
      const entry = schedule[day];
      return {
        index,
        abbr: dayAbbr[index],
        enabled: entry.enabled,
        timeSlots: entry.timeSlots,
      };
    });

    // Collect all time slots from enabled days
    const allSlots: { day: string; start: string; end: string }[] = [];

    for (const item of scheduleArray) {
      if (!item.enabled || item.timeSlots.length === 0) continue;

      for (const slot of item.timeSlots) {
        allSlots.push({
          day: item.abbr,
          start: slot.startTime,
          end: slot.endTime,
        });
      }
    }

    if (allSlots.length === 0) return "No availability set";

    // Group by time range
    const timeGroups: { [key: string]: string[] } = {};

    for (const slot of allSlots) {
      const timeKey = `${slot.start}-${slot.end}`;
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = [];
      }
      timeGroups[timeKey].push(slot.day);
    }

    return Object.entries(timeGroups)
      .map(([timeRange, days]) => {
        const [start, end] = timeRange.split("-");
        const dayRange =
          days.length > 1 && days.length <= 3
            ? `${days[0]} - ${days[days.length - 1]}`
            : days.join(", ");
        return `${dayRange}, ${start.toUpperCase()} - ${end.toUpperCase()}`;
      })
      .join(" | ");
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="min-h-screen bg-white text-gray-900 flex flex-col h-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-700 hover:text-gray-900"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {data?.name ?? "Unnamed Availability Group"}
              </h1>
              <p className="text-sm text-gray-700">
                {getDynamicScheduleSummary()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="set-default" className="text-sm text-gray-700">
                Set to Default
              </Label>
              <Switch
                id="set-default"
                checked={methods.watch("isDefault")}
                onCheckedChange={(checked) =>
                  methods.setValue("isDefault", checked)
                }
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-700 hover:text-gray-900"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Save
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl space-y-4">
              {days.map((day) => (
                <div key={day} className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 w-32">
                      <Switch
                        checked={schedule[day].enabled}
                        onCheckedChange={() => toggleDay(day)}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {day}
                      </span>
                    </div>

                    {schedule[day].enabled &&
                    schedule[day].timeSlots.length > 0 ? (
                      <>
                        {/* First time slot */}
                        <Select
                          value={
                            schedule[day].timeSlots[0]?.startTime || "9:00am"
                          }
                          onValueChange={(value) =>
                            updateTimeSlot(day, 0, "startTime", value)
                          }
                        >
                          <SelectTrigger className="w-24 bg-white border-gray-300 text-gray-900">
                            <SelectValue placeholder="Start Time" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-300 text-gray-900">
                            {Array.from({ length: 96 }).map((_, i) => {
                              const hour = Math.floor(i / 4);
                              const minute = (i % 4) * 15;
                              const formatted = dayjs()
                                .hour(hour)
                                .minute(minute)
                                .format("h:mma");
                              return (
                                <SelectItem key={formatted} value={formatted}>
                                  {formatted}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <span className="text-gray-700">-</span>
                        <Select
                          value={
                            schedule[day].timeSlots[0]?.endTime || "5:00pm"
                          }
                          onValueChange={(value) =>
                            updateTimeSlot(day, 0, "endTime", value)
                          }
                        >
                          <SelectTrigger className="w-24 bg-white border-gray-300 text-gray-900">
                            <SelectValue placeholder="End Time" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-300 text-gray-900">
                            {Array.from({ length: 96 }).map((_, i) => {
                              const hour = Math.floor(i / 4);
                              const minute = (i % 4) * 15;
                              const formatted = dayjs()
                                .hour(hour)
                                .minute(minute)
                                .format("h:mma");
                              return (
                                <SelectItem key={formatted} value={formatted}>
                                  {formatted}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-700 hover:text-gray-900"
                          type="button"
                          onClick={() => addTimeSlot(day)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-700 hover:text-gray-900"
                          type="button"
                          onClick={() => openCopyDialog(day)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {schedule[day].timeSlots.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-700 hover:text-gray-900"
                            type="button"
                            onClick={() => removeTimeSlot(day, 0)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>

                  {/* Additional time slots */}
                  {schedule[day].enabled &&
                    schedule[day].timeSlots.slice(1).map((slot, index) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-4 pl-36"
                      >
                        <Select
                          value={slot.startTime}
                          onValueChange={(value) =>
                            updateTimeSlot(day, index + 1, "startTime", value)
                          }
                        >
                          <SelectTrigger className="w-24 bg-white border-gray-300 text-gray-900">
                            <SelectValue placeholder="Start Time" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-300 text-gray-900">
                            {Array.from({ length: 96 }).map((_, i) => {
                              const hour = Math.floor(i / 4);
                              const minute = (i % 4) * 15;
                              const formatted = dayjs()
                                .hour(hour)
                                .minute(minute)
                                .format("h:mma");
                              return (
                                <SelectItem key={formatted} value={formatted}>
                                  {formatted}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <span className="text-gray-700">-</span>
                        <Select
                          value={slot.endTime}
                          onValueChange={(value) =>
                            updateTimeSlot(day, index + 1, "endTime", value)
                          }
                        >
                          <SelectTrigger className="w-24 bg-white border-gray-300 text-gray-900">
                            <SelectValue placeholder="End Time" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-300 text-gray-900">
                            {Array.from({ length: 96 }).map((_, i) => {
                              const hour = Math.floor(i / 4);
                              const minute = (i % 4) * 15;
                              const formatted = dayjs()
                                .hour(hour)
                                .minute(minute)
                                .format("h:mma");
                              return (
                                <SelectItem key={formatted} value={formatted}>
                                  {formatted}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-700 hover:text-gray-900"
                          type="button"
                          onClick={() => removeTimeSlot(day, index + 1)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 p-6 border-l border-gray-200">
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-2 block text-gray-900">
                  Timezone
                </Label>
                <Select
                  value={timezone}
                  onValueChange={(value) => setValue("timezone", value)}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="Asia/Singapore">
                      Asia/Singapore
                    </SelectItem>
                    <SelectItem value="America/New_York">
                      America/New_York
                    </SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* <div>
                <h4 className="text-sm font-medium mb-3 text-gray-900">
                  Something doesn't look right?
                </h4>
                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent"
                  type="button"
                >
                  Launch troubleshooter
                </Button>
              </div> */}
            </div>
          </div>
        </div>

        {/* Copy Times Dialog */}
        <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
          <DialogContent className="sm:max-w-xs bg-white text-gray-900 border-gray-200 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-900 text-sm font-medium">
                COPY TIMES TO
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedDays.length ===
                    days.filter((d) => d !== copySourceDay).length
                  }
                  onCheckedChange={handleSelectAll}
                  className="border-gray-300"
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none text-gray-900"
                >
                  Select All
                </label>
              </div>
              {days
                .filter((day) => day !== copySourceDay)
                .map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={selectedDays.includes(day)}
                      onCheckedChange={(checked) =>
                        handleDaySelection(day, checked as boolean)
                      }
                      className="border-gray-300"
                    />
                    <label
                      htmlFor={day}
                      className="text-sm leading-none text-gray-900"
                    >
                      {day}
                    </label>
                  </div>
                ))}
            </div>
            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button
                variant="ghost"
                onClick={() => setCopyDialogOpen(false)}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCopyTimes}
                className="bg-gray-900 text-white hover:bg-gray-800"
                disabled={selectedDays.length === 0}
              >
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </FormProvider>
  );
}

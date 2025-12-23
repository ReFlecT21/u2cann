"use client";

import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@adh/ui/ui/button";
import { Input } from "@adh/ui/ui/input";
import { Label } from "@adh/ui/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@adh/ui/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";
import { Calendar } from "@adh/ui/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@adh/ui/ui/popover";
import { Badge } from "@adh/ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@adh/ui/ui/card";
import { api } from "~/trpc/react";
import dayjs from "dayjs";

const exclusionSchema = z.object({
  id: z.string().optional(),
  clinicianId: z.string(),
  date: z.date(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  reason: z.string().optional(),
  type: z.enum([
    "sick",
    "vacation",
    "training",
    "conference",
    "personal",
    "maintenance",
    "emergency",
    "other",
  ]),
});

type ExclusionFormData = z.infer<typeof exclusionSchema>;

interface SlotExclusionsProps {
  clinicianId: string;
}

const exclusionTypeLabels = {
  sick: "Sick Leave",
  vacation: "Vacation",
  training: "Training",
  conference: "Conference",
  personal: "Personal",
  maintenance: "Maintenance",
  emergency: "Emergency",
  other: "Other",
};

const exclusionTypeColors = {
  sick: "bg-red-100 text-red-800",
  vacation: "bg-blue-100 text-blue-800",
  training: "bg-green-100 text-green-800",
  conference: "bg-purple-100 text-purple-800",
  personal: "bg-yellow-100 text-yellow-800",
  maintenance: "bg-orange-100 text-orange-800",
  emergency: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-800",
};

export function SlotExclusions({ clinicianId }: SlotExclusionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExclusion, setEditingExclusion] = useState<any>(null);

  const { data: exclusions, refetch } =
    api.user.availability.getSlotExclusions.useQuery(
      { clinicianId },
      { enabled: !!clinicianId },
    );

  const createMutation = api.user.availability.createSlotExclusion.useMutation({
    onSuccess: () => {
      toast.success("Exclusion created successfully");
      refetch();
      setIsDialogOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = api.user.availability.updateSlotExclusion.useMutation({
    onSuccess: () => {
      toast.success("Exclusion updated successfully");
      refetch();
      setIsDialogOpen(false);
      setEditingExclusion(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = api.user.availability.deleteSlotExclusion.useMutation({
    onSuccess: () => {
      toast.success("Exclusion deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExclusionFormData>({
    resolver: zodResolver(exclusionSchema),
    defaultValues: {
      clinicianId,
      type: "other",
    },
  });

  const selectedDate = watch("date");

  const onSubmit = (data: ExclusionFormData) => {
    const submitData = {
      ...data,
      date: data.date.toISOString().split("T")[0], // Convert to ISO date string
    };

    if (editingExclusion) {
      updateMutation.mutate({
        id: editingExclusion.id,
        ...submitData,
      });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (exclusion: any) => {
    setEditingExclusion(exclusion);
    setValue("id", exclusion.id);
    setValue("clinicianId", exclusion.clinicianId);
    setValue("date", new Date(exclusion.date));
    setValue("startTime", exclusion.startTime);
    setValue("endTime", exclusion.endTime);
    setValue("reason", exclusion.reason || "");
    setValue("type", exclusion.type);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this exclusion?")) {
      deleteMutation.mutate({ id });
    }
  };

  const openCreateDialog = () => {
    setEditingExclusion(null);
    reset({
      clinicianId,
      type: "other",
    });
    setIsDialogOpen(true);
  };

  // Generate time options (15-minute intervals)
  const timeOptions = Array.from({ length: 96 }).map((_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    const formatted = dayjs().hour(hour).minute(minute).format("h:mma");
    return formatted;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Slot Exclusions</h3>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Exclusion
        </Button>
      </div>

      {/* Exclusions List */}
      <div className="space-y-3">
        {exclusions?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No exclusions set. Click "Add Exclusion" to block specific time
              slots.
            </CardContent>
          </Card>
        ) : (
          exclusions?.map((exclusion) => (
            <Card key={exclusion.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">
                        {format(new Date(exclusion.date), "MMM dd, yyyy")}
                      </div>
                      <div className="text-sm text-gray-600">
                        {exclusion.startTime} - {exclusion.endTime}
                      </div>
                      {exclusion.reason && (
                        <div className="text-sm text-gray-500 mt-1">
                          {exclusion.reason}
                        </div>
                      )}
                    </div>
                    <Badge
                      className={
                        exclusionTypeColors[
                          exclusion.type as keyof typeof exclusionTypeColors
                        ]
                      }
                    >
                      {
                        exclusionTypeLabels[
                          exclusion.type as keyof typeof exclusionTypeLabels
                        ]
                      }
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(exclusion)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exclusion.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExclusion ? "Edit Exclusion" : "Add Slot Exclusion"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => setValue("date", date!)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Select
                  value={watch("startTime")}
                  onValueChange={(value) => setValue("startTime", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.startTime && (
                  <p className="text-sm text-red-600">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Select
                  value={watch("endTime")}
                  onValueChange={(value) => setValue("endTime", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="End time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.endTime && (
                  <p className="text-sm text-red-600">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={watch("type")}
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(exclusionTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                {...register("reason")}
                placeholder="e.g., Annual conference, equipment maintenance"
              />
              {errors.reason && (
                <p className="text-sm text-red-600">{errors.reason.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingExclusion ? "Update" : "Create"} Exclusion
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit,
  Clock,
  CalendarDays,
} from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@adh/ui/ui/alert-dialog";
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
import { Card, CardContent } from "@adh/ui/ui/card";
import { Switch } from "@adh/ui/ui/switch";
import { api } from "~/trpc/react";
import dayjs from "dayjs";
import { AdminGuard } from "../components/AdminGuard";

const clinicExclusionSchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().optional(),
  type: z.enum([
    "holiday",
    "maintenance",
    "emergency",
    "training",
    "event",
    "closure",
    "other",
  ]),
  isAllDay: z.boolean().default(false),
});

type ClinicExclusionFormData = z.infer<typeof clinicExclusionSchema>;

const exclusionTypeLabels = {
  holiday: "Holiday",
  maintenance: "Maintenance",
  emergency: "Emergency",
  training: "Staff Training",
  event: "Special Event",
  closure: "Clinic Closure",
  other: "Other",
};

const exclusionTypeColors = {
  holiday: "bg-red-100 text-red-800",
  maintenance: "bg-orange-100 text-orange-800",
  emergency: "bg-red-100 text-red-800",
  training: "bg-green-100 text-green-800",
  event: "bg-purple-100 text-purple-800",
  closure: "bg-gray-100 text-gray-800",
  other: "bg-blue-100 text-blue-800",
};

export default function ClinicExclusionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExclusion, setEditingExclusion] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exclusionToDelete, setExclusionToDelete] = useState<any>(null);

  const { data: exclusions, refetch } =
    api.user.availability.getClinicExclusions.useQuery();

  const createMutation =
    api.user.availability.createClinicExclusion.useMutation({
      onSuccess: () => {
        toast.success("Clinic exclusion created successfully");
        refetch();
        setIsDialogOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const updateMutation =
    api.user.availability.updateClinicExclusion.useMutation({
      onSuccess: () => {
        toast.success("Clinic exclusion updated successfully");
        refetch();
        setIsDialogOpen(false);
        setEditingExclusion(null);
        reset();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const deleteMutation =
    api.user.availability.deleteClinicExclusion.useMutation({
      onSuccess: () => {
        toast.success("Clinic exclusion deleted successfully");
        refetch();
        setDeleteDialogOpen(false);
        setExclusionToDelete(null);
      },
      onError: (error) => {
        toast.error(error.message);
        setDeleteDialogOpen(false);
        setExclusionToDelete(null);
      },
    });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClinicExclusionFormData>({
    resolver: zodResolver(clinicExclusionSchema),
    defaultValues: {
      type: "holiday",
      isAllDay: false,
    },
  });

  const selectedDate = watch("date");
  const isAllDay = watch("isAllDay");

  const onSubmit = (data: ClinicExclusionFormData) => {
    const submitData = {
      date: data.date?.toISOString().split("T")[0] ?? "",
      startTime: data.isAllDay ? undefined : data.startTime,
      endTime: data.isAllDay ? undefined : data.endTime,
      reason: data.reason,
      type: data.type,
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
    setValue("date", new Date(exclusion.date));
    setValue("startTime", exclusion.startTime || "");
    setValue("endTime", exclusion.endTime || "");
    setValue("reason", exclusion.reason || "");
    setValue("type", exclusion.type);
    setValue("isAllDay", !exclusion.startTime && !exclusion.endTime);
    setIsDialogOpen(true);
  };

  const handleDelete = (exclusion: any) => {
    setExclusionToDelete(exclusion);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (exclusionToDelete) {
      deleteMutation.mutate({ id: exclusionToDelete.id });
    }
  };

  const openCreateDialog = () => {
    setEditingExclusion(null);
    reset({
      type: "holiday",
      isAllDay: false,
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
    <AdminGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Clinic Exclusions
            </h1>
            <p className="text-gray-600">
              Manage clinic-wide closures and blocked time slots that affect all
              clinicians
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Clinic Exclusion
          </Button>
        </div>

        {/* Exclusions List */}
        <div className="space-y-4">
          {exclusions?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">
                  No clinic exclusions set
                </h3>
                <p className="text-sm">
                  Add exclusions for holidays, maintenance, or other clinic-wide
                  closures
                </p>
              </CardContent>
            </Card>
          ) : (
            exclusions?.map((exclusion) => (
              <Card key={exclusion.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {exclusion.startTime && exclusion.endTime ? (
                            <Clock className="h-6 w-6 text-gray-600" />
                          ) : (
                            <CalendarDays className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          {format(
                            new Date(exclusion.date),
                            "EEEE, MMMM dd, yyyy",
                          )}
                        </div>
                        <div className="text-gray-600">
                          {exclusion.startTime && exclusion.endTime
                            ? `${exclusion.startTime} - ${exclusion.endTime}`
                            : "All Day"}
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
                        onClick={() => handleDelete(exclusion)}
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingExclusion
                  ? "Edit Clinic Exclusion"
                  : "Add Clinic Exclusion"}
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
                      {selectedDate
                        ? format(selectedDate, "PPP")
                        : "Pick a date"}
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="all-day"
                  checked={isAllDay}
                  onCheckedChange={(checked) => setValue("isAllDay", checked)}
                />
                <Label htmlFor="all-day">All Day Closure</Label>
              </div>

              {!isAllDay && (
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
                  </div>
                </div>
              )}

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
                    {Object.entries(exclusionTypeLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  {...register("reason")}
                  placeholder="e.g., Christmas Day, Equipment maintenance"
                />
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
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingExclusion ? "Update" : "Create"} Exclusion
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Clinic Exclusion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this clinic exclusion?
                {exclusionToDelete && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">
                      {format(
                        new Date(exclusionToDelete.date),
                        "EEEE, MMMM dd, yyyy",
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {exclusionToDelete.startTime && exclusionToDelete.endTime
                        ? `${exclusionToDelete.startTime} - ${exclusionToDelete.endTime}`
                        : "All Day"}
                    </div>
                    {exclusionToDelete.reason && (
                      <div className="text-sm text-gray-500 mt-1">
                        {exclusionToDelete.reason}
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-3 text-sm text-red-600">
                  This action cannot be undone.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Exclusion
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminGuard>
  );
}

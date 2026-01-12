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

const gymClosureSchema = z.object({
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

type GymClosureFormData = z.infer<typeof gymClosureSchema>;

const closureTypeLabels = {
  holiday: "Holiday",
  maintenance: "Maintenance",
  emergency: "Emergency",
  training: "Staff Training",
  event: "Special Event",
  closure: "Gym Closure",
  other: "Other",
};

const closureTypeColors = {
  holiday: "bg-red-100 text-red-800",
  maintenance: "bg-orange-100 text-orange-800",
  emergency: "bg-red-100 text-red-800",
  training: "bg-green-100 text-green-800",
  event: "bg-purple-100 text-purple-800",
  closure: "bg-gray-100 text-gray-800",
  other: "bg-blue-100 text-blue-800",
};

export default function GymClosuresPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClosure, setEditingClosure] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [closureToDelete, setClosureToDelete] = useState<any>(null);

  const { data: closures, refetch } = api.gym.closures.getAll.useQuery();

  const createMutation = api.gym.closures.create.useMutation({
    onSuccess: () => {
      toast.success("Gym closure created successfully");
      refetch();
      setIsDialogOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = api.gym.closures.update.useMutation({
    onSuccess: () => {
      toast.success("Gym closure updated successfully");
      refetch();
      setIsDialogOpen(false);
      setEditingClosure(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = api.gym.closures.delete.useMutation({
    onSuccess: () => {
      toast.success("Gym closure deleted successfully");
      refetch();
      setDeleteDialogOpen(false);
      setClosureToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setDeleteDialogOpen(false);
      setClosureToDelete(null);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GymClosureFormData>({
    resolver: zodResolver(gymClosureSchema),
    defaultValues: {
      type: "holiday",
      isAllDay: true,
    },
  });

  const selectedDate = watch("date");
  const isAllDay = watch("isAllDay");

  const onSubmit = (data: GymClosureFormData) => {
    const submitData = {
      date: data.date?.toISOString().split("T")[0] ?? "",
      startTime: data.isAllDay ? undefined : data.startTime,
      endTime: data.isAllDay ? undefined : data.endTime,
      reason: data.reason,
      type: data.type,
    };

    if (editingClosure) {
      updateMutation.mutate({
        id: editingClosure.id,
        ...submitData,
      });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (closure: any) => {
    setEditingClosure(closure);
    setValue("id", closure.id);
    setValue("date", new Date(closure.date));
    setValue("startTime", closure.startTime || "");
    setValue("endTime", closure.endTime || "");
    setValue("reason", closure.reason || "");
    setValue("type", closure.type);
    setValue("isAllDay", !closure.startTime && !closure.endTime);
    setIsDialogOpen(true);
  };

  const handleDelete = (closure: any) => {
    setClosureToDelete(closure);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (closureToDelete) {
      deleteMutation.mutate({ id: closureToDelete.id });
    }
  };

  const openCreateDialog = () => {
    setEditingClosure(null);
    reset({
      type: "holiday",
      isAllDay: true,
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gym Closures</h1>
            <p className="text-muted-foreground">
              Manage gym-wide closures and blocked time slots
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Closure
          </Button>
        </div>

        {/* Closures List */}
        <div className="space-y-4">
          {closures?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  No gym closures set
                </h3>
                <p className="text-sm">
                  Add closures for holidays, maintenance, or other gym-wide
                  closures
                </p>
              </CardContent>
            </Card>
          ) : (
            closures?.map((closure) => (
              <Card key={closure.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          {closure.startTime && closure.endTime ? (
                            <Clock className="h-6 w-6 text-muted-foreground" />
                          ) : (
                            <CalendarDays className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          {format(new Date(closure.date), "EEEE, MMMM dd, yyyy")}
                        </div>
                        <div className="text-muted-foreground">
                          {closure.startTime && closure.endTime
                            ? `${closure.startTime} - ${closure.endTime}`
                            : "All Day"}
                        </div>
                        {closure.reason && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {closure.reason}
                          </div>
                        )}
                      </div>
                      <Badge
                        className={
                          closureTypeColors[
                            closure.type as keyof typeof closureTypeColors
                          ]
                        }
                      >
                        {
                          closureTypeLabels[
                            closure.type as keyof typeof closureTypeLabels
                          ]
                        }
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(closure)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(closure)}
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
                {editingClosure ? "Edit Gym Closure" : "Add Gym Closure"}
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
                    {Object.entries(closureTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingClosure ? "Update" : "Create"} Closure
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Gym Closure</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this gym closure?
                {closureToDelete && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <div className="font-medium">
                      {format(
                        new Date(closureToDelete.date),
                        "EEEE, MMMM dd, yyyy"
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {closureToDelete.startTime && closureToDelete.endTime
                        ? `${closureToDelete.startTime} - ${closureToDelete.endTime}`
                        : "All Day"}
                    </div>
                    {closureToDelete.reason && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {closureToDelete.reason}
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
                    Delete Closure
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

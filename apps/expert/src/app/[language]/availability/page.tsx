"use client";

import React, { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adh/ui/ui/dialog";
import { Button } from "@adh/ui/ui/button";
import { Input } from "@adh/ui/ui/input";
// Removed unused Select imports
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "~/components/ProjectDataTableExpertList";
import { api } from "~/trpc/react";
import { getColumns, AvailabilityRow } from "./columns"; // Adjust the import path as necessary
import { useParams, useRouter } from "next/navigation";
import { SlotExclusions } from "./SlotExclusions";

const formSchema = z.object({
  id: z.string().optional(),
  dayOfWeek: z.string().min(1, "Day is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

const days = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

export default function AvailabilityPage() {
  const [availabilityList, setAvailabilityList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const { data: clinicianId } =
    api.user.clinicians.getClinicianIdByUserId.useQuery();
  console.log("clinicianId:", clinicianId);
  console.log("Clinician ID for current user:", clinicianId);
  const utils = api.useUtils();

  const { mutateAsync: deleteGroup } =
    api.user.availability.deleteAvailabilityGroup.useMutation({
      onSuccess: () => {
        utils.user.availability.getAllAvailabilityGroups.invalidate();
        toast.success("Availability group deleted");
      },
      onError: () => {
        toast.error("Failed to delete availability group");
      },
    });

  const params = useParams();
  const language = (params?.language as string) || "en";

  function handleEdit(row: AvailabilityRow) {
    // Navigate to the detail editor page for the group
    router.push(`/${language}/availability/${row.id}`);
  }

  async function handleDelete(id: string) {
    await deleteGroup({ id });
  }
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const { data } = api.user.availability.getAllAvailabilityGroups.useQuery();
  console.log("Availability Groups Data:", data);

  // --- Replaced onSubmit function and added TRPC mutation for group creation ---
  const createAvailabilityGroup =
    api.user.availability.createAvailabilityGroup.useMutation({
      onSuccess: () => {
        utils.user.availability.getAllAvailabilityGroups.invalidate();
        setGroupDialogOpen(false);
        setNewGroupName("");
        toast.success("Availability group created successfully");
      },
      onError: () => {
        toast.error("Failed to create availability group");
      },
    });

  const router = useRouter();

  const onSubmit = async (data) => {
    if (!clinicianId) {
      toast.error("Clinician ID not available");
      return;
    }

    try {
      const result = await createAvailabilityGroup.mutateAsync({
        name: data.name || "Untitled Group",
        clinicianId,
      });
      console.log("Created Availability Group:", result);

      if (result?.id) {
        router.push(`/${language}/availability/${result.id}`);
      }
    } catch (err) {
      console.error(err);
    }

    setOpen(false);
    reset();
    setEditingAvailability(null);
  };

  const onEdit = (availability) => {
    setEditingAvailability(availability);
    reset(availability);
    setOpen(true);
  };

  const onAddNew = () => {
    setEditingAvailability(null);
    reset();
    setOpen(true);
  };

  const onAddGroup = () => {
    setGroupDialogOpen(true);
  };

  const onGroupDialogClose = () => {
    setGroupDialogOpen(false);
    setNewGroupName("");
  };

  return (
    <>
      <header className="mb-6 mt-4">
        <div className="flex items-center justify-between space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
            <p className="mt-1 text-sm text-gray-600">
              {data ? `${data.length} availability groups` : "Loading..."}
            </p>
          </div>
          <Button onClick={onAddGroup} className="ml-2">
            Add Availability Group
          </Button>
        </div>
      </header>
      <DataTable
        columns={getColumns({ onEdit: handleEdit, onDelete: handleDelete })}
        data={(data as unknown as AvailabilityRow[]) || []}
      />

      {/* Slot Exclusions Section */}
      {clinicianId && (
        <div className="mt-8">
          <SlotExclusions clinicianId={clinicianId} />
        </div>
      )}

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogTrigger />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Group</DialogTitle>
            <DialogDescription>
              Enter a name for the new availability group.
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <Input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group Name"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                onSubmit({ name: newGroupName });
              }}
              disabled={!newGroupName.trim()}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

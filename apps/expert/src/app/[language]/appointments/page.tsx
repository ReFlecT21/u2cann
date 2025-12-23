"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo, useEffect } from "react";
import { Loading } from "@adh/ui/custom/Loading";
import { DatePicker } from "@adh/ui/custom/DatePicker";
import { TimePicker } from "@adh/ui/custom/TimePicker";
import { Skeleton } from "@adh/ui/ui/skeleton";
import { Button } from "@adh/ui/ui/button";
import { DataTable } from "~/components/ProjectDataTable";
import { api } from "~/trpc/react";
import { getColumns, searchFilterFn } from "./columns";
import { Calendar } from "./components.tsx/calendar";
import { toast } from "@adh/ui/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";
import { Input } from "@adh/ui/ui/input";
import { Badge } from "@adh/ui/ui/badge";
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
  Filter,
  Search,
  X,
  Clock,
  User,
  Stethoscope,
  Plus,
  Calendar as CalendarIcon,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@adh/ui/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@adh/ui/ui/dialog";
import { Label } from "@adh/ui/ui/label";
import { Textarea } from "@adh/ui/ui/text-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import dayjs from "dayjs";

interface FilterState {
  status: string;
  clinician: string;
  appointmentType: string;
  search: string;
}

const createAppointmentSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  clinicianId: z.string().min(1, "Clinician is required"),
  appointmentTypeId: z.string().min(1, "Appointment type is required"),
  speciesId: z.string().min(1, "Species is required"),
  petName: z.string().min(1, "Pet name is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientPhone: z.string().optional(),
  notes: z.string().optional(),
});

type CreateAppointmentForm = z.infer<typeof createAppointmentSchema>;

export default function AppointmentsPage() {
  const t = useTranslations("appointments");
  const utils = api.useUtils();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(
    null,
  );
  const [view, setView] = useState<"table" | "calendar">("table");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(
    null,
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState<Date | undefined>(
    undefined,
  );
  const [startAmPm, setStartAmPm] = useState<"AM" | "PM">("AM");
  const [endAmPm, setEndAmPm] = useState<"AM" | "PM">("AM");
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    clinician: "all",
    appointmentType: "all",
    search: "",
  });

  const createForm = useForm<CreateAppointmentForm>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      clinicianId: "",
      appointmentTypeId: "",
      speciesId: "",
      petName: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      notes: "",
    },
  });

  const updateStatusMutation =
    api.user.appointments.updateAppointmentStatus.useMutation({
      onSuccess: () => {
        toast.success("Appointment status updated successfully");
        utils.user.appointments.getAppointments.invalidate();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const deleteAppointmentMutation =
    api.user.appointments.deleteAppointment.useMutation({
      onSuccess: () => {
        toast.success("Appointment deleted successfully");
        utils.user.appointments.getAppointments.invalidate();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const createAppointmentMutation =
    api.user.appointments.createAppointment.useMutation({
      onSuccess: () => {
        toast.success("Appointment created successfully");
        void utils.user.appointments.getAppointments.invalidate();
        setCreateDialogOpen(false);
        createForm.reset();
      },
      onError: (error) => {
        toast.error(`Failed to create appointment: ${error.message}`);
      },
    });

  // Fetch data for form dropdowns
  const { data: cliniciansData } =
    api.user.clinicians.getAllClinicians.useQuery();
  const { data: appointmentTypesData } =
    api.user.appointmentTypes.getAllAppointmentTypes.useQuery();
  const { data: speciesData } = api.user.species.getAllSpecies.useQuery();

  // Track selected clinician to filter species based on clinician exclusions
  const selectedClinicianId = createForm.watch("clinicianId");

  const excludedSpeciesIds = useMemo(() => {
    const clinician = cliniciansData?.find((c) => c.id === selectedClinicianId);
    return clinician?.species?.map((s: any) => s.id) ?? [];
  }, [cliniciansData, selectedClinicianId]);

  const filteredSpeciesData = useMemo(() => {
    return speciesData?.filter((s) => !excludedSpeciesIds.includes(s.id)) ?? [];
  }, [speciesData, excludedSpeciesIds]);

  // If the currently selected species becomes excluded when clinician changes, reset it
  useEffect(() => {
    const currentSpecies = createForm.getValues("speciesId");
    if (currentSpecies && excludedSpeciesIds.includes(currentSpecies)) {
      createForm.setValue("speciesId", "");
    }
  }, [excludedSpeciesIds, createForm]);

  const handleStatusChange = (
    id: string,
    status: "scheduled" | "cancelled" | "completed",
  ) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    setAppointmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (appointmentToDelete) {
      deleteAppointmentMutation.mutate({ id: appointmentToDelete });
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };

  const columns = getColumns(handleStatusChange, handleDelete, t);
  const { data: isInAdminOrg } = api.user.account.isUserInAdminOrg.useQuery();
  const { data, isLoading, error } =
    api.user.appointments.getAppointments.useQuery({
      isInAdminOrg: isInAdminOrg ?? false,
    });
  console.log("Appointments data:", data);

  // Filter appointments based on current filters
  const filteredAppointments = useMemo(() => {
    if (!data) return [];

    return data.filter((appointment) => {
      // Status filter
      if (
        filters.status !== "all" &&
        appointment.status.toLowerCase() !== filters.status.toLowerCase()
      ) {
        return false;
      }

      // Clinician filter
      if (
        filters.clinician !== "all" &&
        appointment.clinician.name !== filters.clinician
      ) {
        return false;
      }

      // Appointment type filter
      if (
        filters.appointmentType !== "all" &&
        appointment.appointmentType !== filters.appointmentType
      ) {
        return false;
      }

      // Search filter (searches in client name, patient name, and appointment type)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          appointment.client.name.toLowerCase().includes(searchLower) ||
          appointment.patient.name.toLowerCase().includes(searchLower) ||
          appointment.appointmentType.toLowerCase().includes(searchLower) ||
          appointment.clinician.name.toLowerCase().includes(searchLower);

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    if (!data) return { statuses: [], clinicians: [], appointmentTypes: [] };

    const statuses = [...new Set(data.map((apt) => apt.status))];
    const clinicians = [...new Set(data.map((apt) => apt.clinician.name))];
    const appointmentTypes = [
      ...new Set(data.map((apt) => apt.appointmentType)),
    ];

    return { statuses, clinicians, appointmentTypes };
  }, [data]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "matched":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="mt-4 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }
  if (error)
    return (
      <div>
        {t("error")}: {error.message}
      </div>
    );
  if (!data) return <div>{t("noData")}</div>;

  const handleClickProjectInfo = (index: number) => {
    const appointment = filteredAppointments[index];
    if (appointment) {
      setSelectedAppointment(appointment);
    }
  };

  const onCreateSubmit = (formData: CreateAppointmentForm) => {
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    createAppointmentMutation.mutate({
      startTime: startDateTime,
      endTime: endDateTime,
      clinicianId: formData.clinicianId,
      appointmentTypeId: formData.appointmentTypeId,
      speciesId: formData.speciesId,
      petName: formData.petName,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      notes: formData.notes,
    });
  };

  return (
    <>
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("appointmentsTitle")}</h1>
            <p className="text-white-200">
              <p>{t("totalAppointments", { count: data.length })}</p>
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Appointment
          </Button>
        </div>
      </div>

      {/* View Toggle and Filter Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <Button
            variant={view === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("table")}
          >
            <span>Table</span>
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            <span>Calendar</span>
          </Button>
        </div>

        {/* Filter Toggle for Table View */}
        {view === "table" && (
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {Object.values(filters).some(
              (value) => value !== "all" && value !== "",
            ) && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                !
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Filter Panel for Table View */}
      {view === "table" && showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search appointments..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {filterOptions.statuses.map((status) => (
                  <SelectItem key={status} value={status.toLowerCase()}>
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          getStatusColor(status).split(" ")[0]
                        }`}
                      ></div>
                      {status}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clinician Filter */}
            <Select
              value={filters.clinician}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, clinician: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Clinicians" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clinicians</SelectItem>
                {filterOptions.clinicians.map((clinician) => (
                  <SelectItem key={clinician} value={clinician}>
                    {clinician}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Appointment Type Filter */}
            <Select
              value={filters.appointmentType}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, appointmentType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filterOptions.appointmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters & Clear */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.status !== "all" && (
                <Badge variant="secondary" className="flex items-center">
                  Status: {filters.status}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, status: "all" }))
                    }
                  />
                </Badge>
              )}
              {filters.clinician !== "all" && (
                <Badge variant="secondary" className="flex items-center">
                  Clinician: {filters.clinician}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, clinician: "all" }))
                    }
                  />
                </Badge>
              )}
              {filters.appointmentType !== "all" && (
                <Badge variant="secondary" className="flex items-center">
                  Type: {filters.appointmentType}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        appointmentType: "all",
                      }))
                    }
                  />
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="flex items-center">
                  Search: "{filters.search}"
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, search: "" }))
                    }
                  />
                </Badge>
              )}
            </div>

            {Object.values(filters).some(
              (value) => value !== "all" && value !== "",
            ) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFilters({
                    status: "all",
                    clinician: "all",
                    appointmentType: "all",
                    search: "",
                  })
                }
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-2 text-sm text-gray-600">
            Showing {filteredAppointments.length} of {data.length} appointments
          </div>
        </div>
      )}

      <div className="mt-4">
        {view === "table" ? (
          <DataTable
            columns={columns}
            data={filteredAppointments}
            onClickFunction={(index) => handleClickProjectInfo(index)}
            filterFn={searchFilterFn}
          />
        ) : (
          <Calendar appointments={data} />
        )}
      </div>

      {/* Create Appointment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Appointment
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="space-y-6 mt-4"
          >
            {/* Clinician Selection - First Step */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Select Clinician
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="clinicianId">Clinician</Label>
                    <Select
                      onValueChange={(value) =>
                        createForm.setValue("clinicianId", value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select clinician first" />
                      </SelectTrigger>
                      <SelectContent>
                        {cliniciansData?.map((clinician) => (
                          <SelectItem key={clinician.id} value={clinician.id}>
                            {clinician.user.name || clinician.user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createForm.formState.errors.clinicianId && (
                      <p className="text-red-500 text-sm mt-1">
                        {createForm.formState.errors.clinicianId.message}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Select a clinician to see their available time slots
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date and Time Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Step 2: Date & Time
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <div className="mt-1">
                      <DatePicker
                        date={datePickerDate}
                        onSelect={(date) => {
                          setDatePickerDate(date);
                          createForm.setValue(
                            "date",
                            date ? format(date, "yyyy-MM-dd") : "",
                          );
                        }}
                        fullWidth
                      />
                    </div>
                    {createForm.formState.errors.date && (
                      <p className="text-red-500 text-sm mt-1">
                        {createForm.formState.errors.date.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <div className="mt-1">
                      <TimePicker
                        value={createForm.watch("startTime")}
                        onChange={(v) => {
                          createForm.setValue("startTime", v);
                          const hours = Number(v.split(":")[0]);
                          setStartAmPm(hours >= 12 ? "PM" : "AM");
                        }}
                        minuteStep={1}
                      />
                    </div>
                    {createForm.formState.errors.startTime && (
                      <p className="text-red-500 text-sm mt-1">
                        {createForm.formState.errors.startTime.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <div className="mt-1">
                      <TimePicker
                        value={createForm.watch("endTime")}
                        onChange={(v) => {
                          createForm.setValue("endTime", v);
                          const hours = Number(v.split(":")[0]);
                          setEndAmPm(hours >= 12 ? "PM" : "AM");
                        }}
                        minuteStep={1}
                      />
                    </div>
                    {createForm.formState.errors.endTime && (
                      <p className="text-red-500 text-sm mt-1">
                        {createForm.formState.errors.endTime.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                  Step 3: Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointmentTypeId">Appointment Type</Label>
                    <Select
                      onValueChange={(value) =>
                        createForm.setValue("appointmentTypeId", value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointmentTypesData?.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createForm.formState.errors.appointmentTypeId && (
                      <p className="text-red-500 text-sm mt-1">
                        {createForm.formState.errors.appointmentTypeId.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="speciesId">Species</Label>
                    <Select
                      onValueChange={(value) =>
                        createForm.setValue("speciesId", value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select species" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSpeciesData?.map((species) => (
                          <SelectItem key={species.id} value={species.id}>
                            {species.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createForm.formState.errors.speciesId && (
                      <p className="text-red-500 text-sm mt-1">
                        {createForm.formState.errors.speciesId.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient Information Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-amber-600" />
                  Step 4: Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="petName">Pet Name</Label>
                    <Input
                      id="petName"
                      {...createForm.register("petName")}
                      placeholder="Enter pet name"
                      className="mt-1"
                    />
                    {createForm.formState.errors.petName && (
                      <p className="text-red-500 text-sm mt-1">
                        {createForm.formState.errors.petName.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-orange-600" />
                  Step 5: Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      {...createForm.register("clientName")}
                      placeholder="Enter client name"
                      className="mt-1"
                    />
                    {createForm.formState.errors.clientName && (
                      <p className="text-red-500 text-sm mt-1">
                        {createForm.formState.errors.clientName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Client Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      {...createForm.register("clientEmail")}
                      placeholder="Enter client email"
                      className="mt-1"
                    />
                    {createForm.formState.errors.clientEmail && (
                      <p className="text-red-500 text-sm mt-1">
                        {createForm.formState.errors.clientEmail.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Client Phone (Optional)</Label>
                    <Input
                      id="clientPhone"
                      {...createForm.register("clientPhone")}
                      placeholder="Enter client phone"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-gray-600" />
                  Step 6: Notes (Optional)
                </h3>
                <div>
                  <Label htmlFor="notes">Appointment Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    {...createForm.register("notes")}
                    placeholder="Enter any additional notes for this appointment..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAppointmentMutation.isPending}
                className="flex items-center gap-2"
              >
                {createAppointmentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Appointment
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Modal */}
      <Dialog
        open={!!selectedAppointment}
        onOpenChange={() => setSelectedAppointment(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6 mt-4">
              {/* Appointment Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-600" />
                      Appointment Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date & Time:</span>
                        <span className="font-medium">
                          {dayjs(selectedAppointment.time).format(
                            "MMMM DD, YYYY at hh:mm A",
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">
                          {selectedAppointment.appointmentType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}
                        >
                          {selectedAppointment.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fee:</span>
                        <span className="font-medium text-green-600">
                          ${selectedAppointment.fee}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <span className="font-medium">
                          {selectedAppointment.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-green-600" />
                      Client Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">
                          {selectedAppointment.client.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-blue-600">
                          {selectedAppointment.client.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">
                          {selectedAppointment.client.phone}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Patient Information */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2 text-purple-600" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-gray-600 block">Patient Name:</span>
                      <span className="font-medium text-lg">
                        {selectedAppointment.patient.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">
                        Species/Breed:
                      </span>
                      <span className="font-medium">
                        {selectedAppointment.patient.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">
                        Assigned Clinician:
                      </span>
                      <span className="font-medium">
                        {selectedAppointment.clinician.name}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical History Placeholder */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2 text-red-600" />
                    Medical History
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500 mb-2">
                      Medical history will be displayed here
                    </p>
                    <p className="text-sm text-gray-400">
                      Previous appointments, vaccinations, treatments, and notes
                      will appear in this section
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Notes & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Appointment Notes
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-500 text-sm">
                        No notes available for this appointment
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Contact Client
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Reschedule Appointment
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Add Medical Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

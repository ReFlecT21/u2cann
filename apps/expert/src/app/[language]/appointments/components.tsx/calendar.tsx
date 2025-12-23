"use client";

import { useState, useMemo } from "react";
import dayjs from "dayjs";
import { Button } from "@adh/ui/ui/button";
import { Card, CardContent } from "@adh/ui/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@adh/ui/ui/dialog";
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
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Stethoscope,
  X,
  Filter,
  Search,
} from "lucide-react";

interface Appointment {
  time: string;
  appointmentType: string;
  status: string;
  paymentStatus: string;
  client: {
    name: string;
    email: string;
    phone: string;
  };
  patient: {
    name: string;
    type: string;
  };
  clinician: {
    name: string;
    clinic: string;
  };
  fee: number;
}

interface AppointmentsCalendarProps {
  appointments: Appointment[];
}

interface FilterState {
  status: string;
  clinician: string;
  appointmentType: string;
  search: string;
}

export function Calendar({ appointments }: AppointmentsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("week");
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<{
    date: string;
    appointments: Appointment[];
  } | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    clinician: "all",
    appointmentType: "all",
    search: "",
  });

  // Filter appointments based on current filters
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
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
  }, [appointments, filters]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const statuses = [...new Set(appointments.map((apt) => apt.status))];
    const clinicians = [
      ...new Set(appointments.map((apt) => apt.clinician.name)),
    ];
    const appointmentTypes = [
      ...new Set(appointments.map((apt) => apt.appointmentType)),
    ];

    return { statuses, clinicians, appointmentTypes };
  }, [appointments]);

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // First day is Sunday
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      weekDays.push(currentDay);
    }
    return weekDays;
  };

  const getAppointmentsForDate = (day: number | Date) => {
    if (!day) return [];

    let dateStr: string;
    if (day instanceof Date) {
      dateStr = dayjs(day).format("YYYY-MM-DD");
    } else {
      dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    return filteredAppointments.filter(
      (apt) => dayjs(apt.time).format("YYYY-MM-DD") === dateStr,
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const navigate = (direction: "prev" | "next") => {
    if (view === "month") {
      navigateMonth(direction);
    } else {
      navigateWeek(direction);
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const days = view === "month" ? getDaysInMonth(currentDate) : null;
  const weekDays = view === "week" ? getWeekDays(currentDate) : null;

  // Generate time slots for week view (8 AM to 6 PM)
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8; // Start from 8 AM
    return {
      hour,
      label:
        hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
      time24: `${hour.toString().padStart(2, "0")}:00`,
    };
  });

  const getAppointmentPosition = (appointmentTime: string) => {
    const hour = dayjs(appointmentTime).hour();
    const minute = dayjs(appointmentTime).minute();

    // Calculate position within the 8 AM - 6 PM range
    if (hour < 8 || hour >= 19) return null; // Outside business hours

    const slotIndex = hour - 8;
    const minuteOffset = (minute / 60) * 96; // Each slot is 96px (h-24 = 6rem = 96px)

    return {
      top: `${slotIndex * 96 + minuteOffset}px`,
      height: "80px", // Default appointment height
    };
  };

  const getHeaderTitle = () => {
    if (view === "month") {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      const weekStart = getWeekDays(currentDate)[0];
      const weekEnd = getWeekDays(currentDate)[6];
      if (weekStart && weekEnd) {
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        } else {
          return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        }
      }
      return "";
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {getHeaderTitle()}
            </h2>
            <div className="flex items-center space-x-2">
              {/* Filter Toggle */}
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
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 p-0 text-xs"
                  >
                    !
                  </Badge>
                )}
              </Button>

              {/* View Toggle */}
              <div className="flex items-center space-x-1 mr-4">
                <Button
                  variant={view === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("month")}
                >
                  Month
                </Button>
                <Button
                  variant={view === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("week")}
                >
                  Week
                </Button>
              </div>

              {/* Navigation */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
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
                            className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(status).split(" ")[0]}`}
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
                Showing {filteredAppointments.length} of {appointments.length}{" "}
                appointments
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {view === "week" ? (
            // Week view with time grid
            <div className="flex rounded-lg border overflow-hidden bg-white">
              {/* Time column */}
              <div className="w-20 bg-gray-50 border-r">
                <div className="h-16 border-b border-gray-200"></div>{" "}
                {/* Header spacer */}
                {timeSlots.map((slot) => (
                  <div
                    key={slot.hour}
                    className="h-24 border-b border-gray-200 flex items-start justify-end pr-3 pt-1"
                  >
                    <span className="text-xs text-gray-500 font-medium">
                      {slot.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Days columns */}
              <div className="flex-1 grid grid-cols-7">
                {/* Day headers */}
                {dayNames.map((day, index) => {
                  const date = weekDays?.[index];
                  const isToday =
                    date &&
                    new Date().getDate() === date.getDate() &&
                    new Date().getMonth() === date.getMonth() &&
                    new Date().getFullYear() === date.getFullYear();

                  return (
                    <div
                      key={day}
                      className="border-r border-gray-200 last:border-r-0"
                    >
                      {/* Day header */}
                      <div
                        className={`h-16 border-b border-gray-200 p-3 text-center ${
                          isToday ? "bg-blue-50" : "bg-gray-50"
                        }`}
                      >
                        <div
                          className={`text-sm font-medium ${
                            isToday ? "text-blue-600" : "text-gray-700"
                          }`}
                        >
                          {day}
                        </div>
                        <div
                          className={`text-lg font-bold mt-1 ${
                            isToday ? "text-blue-600" : "text-gray-900"
                          }`}
                        >
                          {date?.getDate()}
                        </div>
                      </div>

                      {/* Time slots */}
                      <div className="relative">
                        {timeSlots.map((slot) => (
                          <div
                            key={slot.hour}
                            className="h-24 border-b border-gray-100 hover:bg-gray-50 relative"
                          >
                            {/* 30-minute dotted line */}
                            <div className="absolute top-12 left-0 right-0 border-t border-dotted border-gray-300"></div>
                          </div>
                        ))}

                        {/* Appointments overlay */}
                        <div className="absolute inset-0 p-1">
                          {date &&
                            getAppointmentsForDate(date).map((appointment) => {
                              const position = getAppointmentPosition(
                                appointment.time,
                              );
                              if (!position) return null;

                              return (
                                <div
                                  key={
                                    appointment.time + appointment.client.email
                                  }
                                  className={`absolute left-1 right-1 p-2 rounded-md border text-xs ${getStatusColor(appointment.status)} transition-all hover:shadow-md cursor-pointer z-10`}
                                  style={{
                                    top: position.top,
                                    height: position.height,
                                  }}
                                  title={`${dayjs(appointment.time).format("hh:mm A")} - ${appointment.client.name} (${appointment.patient.name}) with ${appointment.clinician.name}`}
                                  onClick={() =>
                                    setSelectedAppointment(appointment)
                                  }
                                >
                                  <div className="flex items-center font-medium mb-1">
                                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">
                                      {dayjs(appointment.time).format("HH:mm")}
                                    </span>
                                  </div>
                                  <div className="flex items-center mb-1">
                                    <User className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate text-xs">
                                      {appointment.client.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <Stethoscope className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate text-xs opacity-75">
                                      {appointment.clinician.name}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Month view (existing layout)
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {/* Day headers */}
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700"
                >
                  {day}
                </div>
              ))}

              {/* Calendar content */}
              {days?.map((day, index) => {
                const dayAppointments = day ? getAppointmentsForDate(day) : [];
                const isToday =
                  day &&
                  new Date().getDate() === day &&
                  new Date().getMonth() === currentDate.getMonth() &&
                  new Date().getFullYear() === currentDate.getFullYear();

                return (
                  <div
                    key={index}
                    className={`bg-white min-h-[140px] p-2 border border-gray-200 ${
                      day ? "hover:bg-gray-50" : ""
                    } ${isToday ? "bg-blue-50 border-2 border-blue-200" : ""}`}
                  >
                    {day && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-gray-900"}`}
                          >
                            {day}
                          </div>
                          {dayAppointments.length > 0 && (
                            <div className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 font-medium">
                              {dayAppointments.length}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                          {dayAppointments.slice(0, 4).map((appointment) => (
                            <div
                              key={appointment.time + appointment.client.email}
                              className={`p-1.5 rounded-md border text-xs ${getStatusColor(appointment.status)} transition-all hover:shadow-sm cursor-pointer`}
                              title={`${dayjs(appointment.time).format("hh:mm A")} - ${appointment.client.name} (${appointment.patient.name}) with ${appointment.clinician.name}`}
                              onClick={() =>
                                setSelectedAppointment(appointment)
                              }
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center font-medium">
                                  <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">
                                    {dayjs(appointment.time).format("HH:mm")}
                                  </span>
                                </div>
                                <div className="text-xs opacity-75 ml-1">
                                  {appointment.appointmentType.slice(0, 3)}
                                </div>
                              </div>
                              <div className="flex items-center mb-1">
                                <User className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate text-xs">
                                  {appointment.client.name}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Stethoscope className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate text-xs opacity-75">
                                  {appointment.clinician.name}
                                </span>
                              </div>
                            </div>
                          ))}
                          {dayAppointments.length > 4 && (
                            <div
                              className="text-center text-xs opacity-60 py-1 font-medium cursor-pointer hover:opacity-80 hover:bg-gray-100 rounded"
                              onClick={() =>
                                setSelectedDayAppointments({
                                  date: `${monthNames[currentDate.getMonth()]} ${day}, ${currentDate.getFullYear()}`,
                                  appointments: dayAppointments,
                                })
                              }
                            >
                              +{dayAppointments.length - 4} more appointments
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
                <span className="text-xs text-gray-600">Active/Confirmed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
                <span className="text-xs text-gray-600">Scheduled/Matched</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div>
                <span className="text-xs text-gray-600">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Single Appointment Detail Modal */}
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

      {/* Appointments Detail Modal */}
      <Dialog
        open={!!selectedDayAppointments}
        onOpenChange={() => setSelectedDayAppointments(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Appointments for {selectedDayAppointments?.date}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDayAppointments(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedDayAppointments?.appointments.map((appointment) => (
              <Card
                key={appointment.time + appointment.client.email}
                className={`p-4 border ${getStatusColor(appointment.status)}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm font-medium">
                      <Clock className="h-4 w-4 mr-2" />
                      {dayjs(appointment.time).format("hh:mm A")}
                    </div>
                    <div className="text-sm font-medium">
                      ${appointment.fee}
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">
                      {appointment.client.name}
                    </span>
                    <span className="text-gray-500 ml-2">
                      ({appointment.client.email})
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    <span>{appointment.clinician.name}</span>
                    <span className="text-gray-500 ml-2">
                      - {appointment.clinician.clinic}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Patient:</strong> {appointment.patient.name} (
                    {appointment.patient.type})
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Type:</strong> {appointment.appointmentType}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Status: {appointment.status}
                    </span>
                    <span className="text-gray-500">
                      Payment: {appointment.paymentStatus}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

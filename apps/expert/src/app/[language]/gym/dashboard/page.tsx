"use client";

import { useState } from "react";
import { format, addDays, subDays, startOfWeek } from "date-fns";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@adh/ui/ui/card";
import { Button } from "@adh/ui/ui/button";
import { Badge } from "@adh/ui/ui/badge";
import { Progress } from "@adh/ui/ui/progress";
import { Skeleton } from "@adh/ui/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@adh/ui/ui/accordion";
import {
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Mail,
  Phone,
  ClipboardCheck,
} from "lucide-react";
import { AttendanceDialog } from "./AttendanceDialog";

interface SelectedSession {
  id: string;
  name: string;
  bookings: any[];
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceSession, setAttendanceSession] = useState<SelectedSession | null>(null);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

  const { data: todaySessions, isLoading: loadingSessions } =
    api.gym.dashboard.getTodaySessions.useQuery({
      date: selectedDate,
    });

  const { data: stats, isLoading: loadingStats } =
    api.gym.dashboard.getStats.useQuery({
      date: selectedDate,
    });

  const { data: weeklyData } = api.gym.dashboard.getWeeklyOverview.useQuery({
    weekStart,
  });

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  const isToday =
    format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      {/* Header with Date Navigation */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Dashboard</h1>
          <p className="text-muted-foreground">
            {isToday ? "Today's" : format(selectedDate, "EEEE's")} classes and bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={isToday ? "default" : "outline"}
            onClick={goToToday}
            className="min-w-[140px]"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {format(selectedDate, "EEE, MMM d")}
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalSessions ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats?.fullSessions ?? 0} at capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalBookings ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              of {stats?.totalCapacity ?? 0} total spots
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.availableSpots ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">spots remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.occupancyRate ?? 0}%</div>
                <Progress value={stats?.occupancyRate ?? 0} className="mt-2" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Sessions - Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {isToday ? "Today's" : format(selectedDate, "EEEE's")} Sessions
          </h2>

          {loadingSessions ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : todaySessions?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No sessions scheduled for this day</p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-3">
              {todaySessions?.map((session) => {
                const isFull = session.bookedCount >= session.capacity;
                const occupancy = Math.round(
                  (session.bookedCount / session.capacity) * 100
                );

                return (
                  <AccordionItem
                    key={session.id}
                    value={session.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4 w-full">
                        {/* Color indicator */}
                        <div
                          className="w-1.5 h-12 rounded-full"
                          style={{
                            backgroundColor: session.classType?.color || "#3B82F6",
                          }}
                        />

                        {/* Session info */}
                        <div className="flex-1 text-left">
                          <div className="font-semibold flex items-center gap-2">
                            {session.classType?.displayName}
                            {isFull && (
                              <Badge variant="destructive" className="text-xs">
                                FULL
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(session.startTime), "h:mm a")} -{" "}
                              {format(new Date(session.endTime), "h:mm a")}
                            </span>
                            <span>•</span>
                            <span>{session.instructor?.name}</span>
                          </div>
                        </div>

                        {/* Booking count */}
                        <div className="text-right mr-4">
                          <div className="text-lg font-bold">
                            {session.bookedCount}/{session.capacity}
                          </div>
                          <Progress value={occupancy} className="w-24 h-2" />
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-4">
                      {/* Mark Attendance Button */}
                      {session.bookings.length > 0 && (
                        <div className="mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttendanceSession({
                                id: session.id,
                                name: session.classType?.displayName || "Session",
                                bookings: session.bookings,
                              });
                            }}
                            className="w-full"
                          >
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            Mark Attendance
                          </Button>
                        </div>
                      )}

                      {session.bookings.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          No bookings yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Attendees ({session.bookings.length})
                          </h4>
                          <div className="grid gap-2">
                            {session.bookings.map((booking, idx) => {
                              const isAbsent = booking.attended === false;
                              return (
                                <div
                                  key={booking.id}
                                  className={`flex items-center justify-between p-3 rounded-lg ${
                                    isAbsent
                                      ? "bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900"
                                      : "bg-muted/50"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                      isAbsent
                                        ? "bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300"
                                        : "bg-primary/10"
                                    }`}>
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <div className="font-medium flex items-center gap-2">
                                        {booking.user?.name || booking.guestName}
                                        {isAbsent && (
                                          <Badge variant="destructive" className="text-xs">
                                            Absent
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-3 w-3" />
                                        {booking.user?.email || booking.guestEmail}
                                      </div>
                                    </div>
                                  </div>
                                  {(booking.user?.phone || booking.guestPhone) && (
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {booking.user?.phone || booking.guestPhone}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>

        {/* Weekly Overview - Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            This Week
          </h2>

          <Card>
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold">{stats?.weeklyBookings ?? 0}</div>
                <p className="text-sm text-muted-foreground">total bookings this week</p>
              </div>

              <div className="space-y-2">
                {weeklyData &&
                  Object.entries(weeklyData.days).map(([dateKey, sessions]) => {
                    const date = new Date(dateKey);
                    const isSelected =
                      format(date, "yyyy-MM-dd") ===
                      format(selectedDate, "yyyy-MM-dd");
                    const totalBookings = sessions.reduce(
                      (sum, s) => sum + (s._count?.bookings ?? 0),
                      0
                    );
                    const totalCapacity = sessions.reduce(
                      (sum, s) => sum + s.capacity,
                      0
                    );

                    return (
                      <button
                        key={dateKey}
                        onClick={() => setSelectedDate(date)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{format(date, "EEE")}</div>
                            <div
                              className={`text-xs ${
                                isSelected
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {format(date, "MMM d")}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{sessions.length}</div>
                            <div
                              className={`text-xs ${
                                isSelected
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {totalBookings}/{totalCapacity}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance Dialog */}
      <AttendanceDialog
        open={!!attendanceSession}
        onOpenChange={(open) => !open && setAttendanceSession(null)}
        sessionId={attendanceSession?.id ?? ""}
        sessionName={attendanceSession?.name ?? ""}
        bookings={attendanceSession?.bookings ?? []}
      />
    </div>
  );
}

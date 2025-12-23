"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@adh/ui/ui/card";
import { Button } from "@adh/ui/ui/button";
import { Badge } from "@adh/ui/ui/badge";
import { Separator } from "@adh/ui/ui/separator";
import { api } from "~/trpc/react";

export default function OverviewPage() {
  const params = useParams();
  const language = (params?.language as string) || "en";

  const { data: isInAdminOrg } = api.user.account.isUserInAdminOrg.useQuery();
  const { data: appointments = [] } =
    api.user.appointments.getAppointments.useQuery({
      isInAdminOrg: isInAdminOrg ?? false,
    });
  const { data: groups = [] } =
    api.user.availability.getAllAvailabilityGroups.useQuery();

  const todayCount = useMemo(
    () =>
      appointments.filter((a) => dayjs(a.time).isSame(dayjs(), "day")).length,
    [appointments],
  );
  const weekCount = useMemo(
    () =>
      appointments.filter((a) => dayjs(a.time).isSame(dayjs(), "week")).length,
    [appointments],
  );
  const nextAppt = useMemo(() => {
    return [...appointments]
      .sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf())
      .find((a) => dayjs(a.time).isAfter(dayjs()));
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Ensure DB record merged to Clerk id at first visit after sign-in */}
      <MergeOnLoad />
      <header className="mt-4">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">
          Manage your day at a glance: upcoming appointments and availability.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Today" value={todayCount} subtitle="appointments" />
        <StatCard title="This week" value={weekCount} subtitle="appointments" />
        <StatCard title="Availability groups" value={groups.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming appointments */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Upcoming appointments
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => location.assign(`/${language}/appointments`)}
            >
              View all
            </Button>
          </CardHeader>
          <div className="px-6 pb-4">
            {appointments.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No appointments
              </div>
            ) : (
              <ul className="divide-y">
                {appointments.slice(0, 6).map((a, i) => (
                  <li
                    key={i}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        {dayjs(a.time).format("ddd, D MMM • h:mm A")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {a.patient.name} • {a.patient.type} •{" "}
                        {a.appointmentType}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{a.clinician.clinic}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.status}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Availability summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Availability
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => location.assign(`/${language}/availability`)}
            >
              Manage
            </Button>
          </CardHeader>
          <div className="px-6 pb-6 space-y-4">
            {groups.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No availability groups
              </div>
            ) : (
              groups.slice(0, 3).map((g) => (
                <div key={g.id}>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="font-medium">
                      {g.name || "Working Hours"}
                    </div>
                    {g.isDefault ? (
                      <Badge className="bg-green-600 text-white">Default</Badge>
                    ) : null}
                  </div>
                  <div className="text-sm space-y-1">
                    {groupHoursByTime(g.availability).map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                    <div className="text-muted-foreground">{g.timezone}</div>
                  </div>
                  <Separator className="my-3" />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {nextAppt ? (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Next appointment
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {dayjs(nextAppt.time).format("ddd, D MMM • h:mm A")}
            </div>
          </CardHeader>
          <div className="px-6 pb-6 text-sm">
            <div className="font-medium">{nextAppt.patient.name}</div>
            <div className="text-muted-foreground">
              {nextAppt.patient.type} • {nextAppt.appointmentType}
            </div>
            <div className="mt-2 text-muted-foreground">
              {nextAppt.clinician.clinic}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <Card className="p-6">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {subtitle ? (
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      ) : null}
    </Card>
  );
}

function MergeOnLoad() {
  // Call merge endpoint once on first load after sign-in
  // No UI impact; failures are ignored
  if (typeof window !== "undefined") {
    // Fire and forget
    fetch("/api/internal/merge-user", {
      method: "POST",
      cache: "no-store",
    }).catch(() => {});
  }
  return null;
}

function groupHoursByTime(
  hours: { day: string; start: string; end: string }[],
) {
  if (!hours || hours.length === 0) return [] as string[];
  const groups: { days: string[]; start: string; end: string }[] = [];
  hours.forEach(({ day, start, end }) => {
    const startFmt = formatTime(start);
    const endFmt = formatTime(end);
    const found = groups.find((g) => g.start === startFmt && g.end === endFmt);
    if (found) found.days.push(day);
    else groups.push({ days: [day], start: startFmt, end: endFmt });
  });
  return groups.map((g) => `${formatDays(g.days)}, ${g.start} - ${g.end}`);
}

function formatDays(days: string[]) {
  const abbr = days.map((d) => d.slice(0, 3));
  if (abbr.length === 1) return abbr[0];
  if (abbr.length === 2) return abbr.join(" - ");
  return `${abbr[0]} - ${abbr[abbr.length - 1]}`;
}

function formatTime(raw: string) {
  const formats = ["HH:mm", "H:mm", "h:mma", "h:mmA", "h:mm a", "h:mm A"];
  for (const f of formats) {
    const d = dayjs(raw, f, true);
    if (d.isValid()) return d.format("h:mm A");
  }
  return raw;
}

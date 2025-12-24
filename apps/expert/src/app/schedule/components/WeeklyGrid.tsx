"use client";

import { ClassCard } from "./ClassCard";

interface Session {
  id: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  bookedCount: number;
  isCancelled: boolean;
  classType: {
    id: string;
    displayName: string;
    description?: string | null;
    duration: number;
    isOpenGym: boolean;
    color?: string | null;
  };
  instructor: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
    location: string;
  };
}

interface WeeklyGridProps {
  sessions: Session[];
  weekStart: Date;
  onSelectSession: (session: Session) => void;
}

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export function WeeklyGrid({ sessions, weekStart, onSelectSession }: WeeklyGridProps) {
  // Group sessions by day of week
  const groupedByDay: Record<number, Session[]> = {};

  for (const session of sessions) {
    if (session.isCancelled) continue;

    const dayOfWeek = new Date(session.startTime).getDay();
    if (!groupedByDay[dayOfWeek]) {
      groupedByDay[dayOfWeek] = [];
    }
    groupedByDay[dayOfWeek].push(session);
  }

  // Sort sessions within each day by start time
  for (const day in groupedByDay) {
    groupedByDay[Number(day)]?.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  // Get dates for each day of the week
  const getDayDate = (dayIndex: number) => {
    const date = new Date(weekStart);
    const diff = dayIndex - date.getDay();
    date.setDate(date.getDate() + diff);
    return date;
  };

  // Only show weekdays (Monday - Friday) by default
  const displayDays = [1, 2, 3, 4, 5]; // Monday to Friday

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {displayDays.map((dayIndex) => {
        const dayDate = getDayDate(dayIndex);
        const daySessions = groupedByDay[dayIndex] || [];

        return (
          <div key={dayIndex} className="min-h-[400px]">
            {/* Day Header */}
            <div className="mb-4 pb-2 border-b-2 border-gray-900">
              <h2 className="text-lg font-bold tracking-wide">{DAYS[dayIndex]}</h2>
            </div>

            {/* Sessions */}
            <div className="space-y-3">
              {daySessions.length > 0 ? (
                daySessions.map((session) => (
                  <ClassCard
                    key={session.id}
                    session={session}
                    onClick={() => onSelectSession(session)}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No classes scheduled</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

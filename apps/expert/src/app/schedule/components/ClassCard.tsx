"use client";

import { cn } from "@adh/ui";
import { SpotsBadge } from "./SpotsBadge";

interface ClassCardProps {
  session: {
    id: string;
    startTime: Date;
    endTime: Date;
    capacity: number;
    bookedCount: number;
    classType: {
      displayName: string;
      isOpenGym: boolean;
      color?: string | null;
    };
    instructor: {
      name: string;
    };
  };
  onClick: () => void;
}

export function ClassCard({ session, onClick }: ClassCardProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTimeRange = (start: Date, end: Date) => {
    const startTime = formatTime(start);
    const endTime = formatTime(end);

    // For Open Gym, show the full range
    if (session.classType.isOpenGym) {
      return `${startTime} - ${endTime}`;
    }

    return startTime;
  };

  const availableSpots = session.capacity - session.bookedCount;
  const isFull = availableSpots <= 0;

  return (
    <button
      onClick={onClick}
      disabled={isFull}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all duration-200",
        "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
        session.classType.isOpenGym
          ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 focus:ring-amber-500"
          : "border-border bg-card hover:bg-muted focus:ring-ring",
        isFull && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn(
          "text-sm font-medium",
          session.classType.isOpenGym ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
        )}>
          {formatTimeRange(session.startTime, session.endTime)}
        </span>
        <SpotsBadge
          availableSpots={availableSpots}
          capacity={session.capacity}
        />
      </div>

      <h3 className={cn(
        "mt-1 font-semibold",
        session.classType.isOpenGym ? "text-amber-900 dark:text-amber-200" : "text-foreground"
      )}>
        {session.classType.displayName}
      </h3>

      <p className={cn(
        "text-sm",
        session.classType.isOpenGym ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
      )}>
        {session.classType.isOpenGym ? "Self-Guided" : session.instructor.name}
      </p>
    </button>
  );
}

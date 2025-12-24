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
        "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2",
        session.classType.isOpenGym
          ? "border-amber-300 bg-amber-50 hover:bg-amber-100 focus:ring-amber-500"
          : "border-gray-200 bg-white hover:bg-gray-50 focus:ring-blue-500",
        isFull && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn(
          "text-sm font-medium",
          session.classType.isOpenGym ? "text-amber-700" : "text-gray-600"
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
        session.classType.isOpenGym ? "text-amber-900" : "text-gray-900"
      )}>
        {session.classType.displayName}
      </h3>

      <p className={cn(
        "text-sm",
        session.classType.isOpenGym ? "text-amber-700" : "text-gray-500"
      )}>
        {session.classType.isOpenGym ? "Self-Guided" : session.instructor.name}
      </p>
    </button>
  );
}

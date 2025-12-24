"use client";

import { Button } from "@adh/ui/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekNavigatorProps {
  weekStart: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

export function WeekNavigator({
  weekStart,
  onPreviousWeek,
  onNextWeek,
}: WeekNavigatorProps) {
  const formatDateRange = () => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const todayWeekStart = new Date(today);
    todayWeekStart.setDate(today.getDate() - today.getDay());
    todayWeekStart.setHours(0, 0, 0, 0);

    const compareStart = new Date(weekStart);
    compareStart.setHours(0, 0, 0, 0);

    return todayWeekStart.getTime() === compareStart.getTime();
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={onPreviousWeek}
        disabled={isCurrentWeek()}
        className="h-10 w-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="text-center min-w-[220px]">
        <p className="text-gray-600 text-sm">
          Schedule for {formatDateRange()}
        </p>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onNextWeek}
        className="h-10 w-10"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

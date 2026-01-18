"use client";

import { cn } from "@adh/ui";

interface SpotsBadgeProps {
  availableSpots: number;
  capacity: number;
}

export function SpotsBadge({ availableSpots, capacity }: SpotsBadgeProps) {
  const getColorClasses = () => {
    if (availableSpots <= 0) {
      return "bg-muted text-muted-foreground border-border";
    }
    if (availableSpots === 1) {
      return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
    }
    if (availableSpots <= 4) {
      return "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
    }
    return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
  };

  const getText = () => {
    if (availableSpots <= 0) {
      return "Full";
    }
    return `${availableSpots} spots`;
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        getColorClasses()
      )}
    >
      {getText()}
    </span>
  );
}

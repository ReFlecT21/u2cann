"use client";

import { cn } from "@adh/ui";

interface SpotsBadgeProps {
  availableSpots: number;
  capacity: number;
}

export function SpotsBadge({ availableSpots, capacity }: SpotsBadgeProps) {
  const getColorClasses = () => {
    if (availableSpots <= 0) {
      return "bg-gray-100 text-gray-600 border-gray-200";
    }
    if (availableSpots === 1) {
      return "bg-red-100 text-red-700 border-red-200";
    }
    if (availableSpots <= 4) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
    return "bg-green-100 text-green-700 border-green-200";
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

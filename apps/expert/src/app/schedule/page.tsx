"use client";

import { useState, useMemo } from "react";
import { Skeleton } from "@adh/ui/ui/skeleton";
import { api } from "~/trpc/react";
import { WeeklyGrid } from "./components/WeeklyGrid";
import { WeekNavigator } from "./components/WeekNavigator";
import { BookingModal } from "./components/BookingModal";

// Get Monday of the current week
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = api.gym.public.getWeeklySchedule.useQuery({
    weekStartDate: weekStart,
  });

  const handlePreviousWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStart(newDate);
  };

  const handleSelectSession = (session: any) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  // Format date range for header
  const dateRangeText = useMemo(() => {
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
  }, [weekStart]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Unable to load schedule
          </h1>
          <p className="mt-2 text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tight">
              SEE YOU THIS WEEK
            </h1>
            <p className="mt-2 text-gray-300">
              Schedule for {dateRangeText}
            </p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="border-b bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <WeekNavigator
            weekStart={weekStart}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <WeeklyGrid
            sessions={data?.sessions || []}
            weekStart={weekStart}
            onSelectSession={handleSelectSession}
          />
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        session={selectedSession}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            Click on any class to book your spot
          </p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Skeleton } from "@adh/ui/ui/skeleton";
import { Button } from "@adh/ui/ui/button";
import { LogIn } from "lucide-react";
import { api } from "~/trpc/react";
import { WeeklyGrid } from "./components/WeeklyGrid";
import { WeekNavigator } from "./components/WeekNavigator";
import { BookingModal } from "./components/BookingModal";
import { MembershipBadge } from "./components/MembershipBadge";

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

  const { isSignedIn, isLoaded } = useUser();

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Unable to load schedule
          </h1>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gray-900 dark:bg-gray-950 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Bar with Auth */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              Boxing Gym
            </div>
            <div className="flex items-center gap-4">
              {!isLoaded ? (
                <Skeleton className="h-8 w-24 bg-gray-700" />
              ) : isSignedIn ? (
                <div className="flex items-center gap-4">
                  <MembershipBadge />
                  <UserButton
                    afterSignOutUrl="/schedule"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                      },
                    }}
                  />
                </div>
              ) : (
                <Link href="/sign-in?redirect_url=/schedule">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Main Title */}
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
      <div className="border-b border-border bg-muted/50 py-4">
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
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            {isSignedIn
              ? "Click on any class to book your spot"
              : "Sign in with your membership to book classes"}
          </p>
        </div>
      </footer>
    </div>
  );
}

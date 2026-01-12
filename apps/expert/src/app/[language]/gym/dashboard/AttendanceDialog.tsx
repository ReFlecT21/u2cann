"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@adh/ui/ui/dialog";
import { Input } from "@adh/ui/ui/input";
import { Switch } from "@adh/ui/ui/switch";
import { Badge } from "@adh/ui/ui/badge";
import { Search, User, CreditCard, Mail, Phone } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  attended: boolean;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  sessionUsage: {
    id: string;
    membershipId: string;
  } | null;
}

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionName: string;
  bookings: Booking[];
}

export function AttendanceDialog({
  open,
  onOpenChange,
  sessionId,
  sessionName,
  bookings,
}: AttendanceDialogProps) {
  const [search, setSearch] = useState("");
  // Local state to track attendance changes optimistically
  const [localAttendance, setLocalAttendance] = useState<Record<string, boolean>>({});
  const utils = api.useUtils();

  // Reset local state when bookings change (dialog opens/closes)
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    bookings.forEach((b) => {
      initial[b.id] = b.attended;
    });
    setLocalAttendance(initial);
  }, [bookings]);

  const markAttendance = api.gym.dashboard.markAttendance.useMutation({
    onSuccess: (data, variables) => {
      utils.gym.dashboard.getTodaySessions.invalidate();
      if (data.sessionRefunded) {
        toast.success("Marked absent - session refunded to flexi pack");
      } else if (data.sessionDeducted) {
        toast.success("Marked attended - session deducted from flexi pack");
      } else {
        toast.success(variables.attended ? "Marked as attended" : "Marked as absent");
      }
    },
    onError: (error, variables) => {
      // Revert optimistic update on error
      setLocalAttendance((prev) => ({
        ...prev,
        [variables.bookingId]: !variables.attended,
      }));
      toast.error(error.message || "Failed to update attendance");
    },
  });

  const filteredBookings = useMemo(() => {
    if (!search.trim()) return bookings;
    const query = search.toLowerCase();
    return bookings.filter((b) => {
      const name = (b.user?.name || b.guestName).toLowerCase();
      const email = (b.user?.email || b.guestEmail).toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [bookings, search]);

  const handleToggleAttendance = (bookingId: string, currentAttended: boolean) => {
    // Optimistically update local state
    setLocalAttendance((prev) => ({
      ...prev,
      [bookingId]: !currentAttended,
    }));
    markAttendance.mutate({
      bookingId,
      attended: !currentAttended,
    });
  };

  // Use local state for counts
  const attendedCount = Object.values(localAttendance).filter(Boolean).length;
  const absentCount = bookings.length - attendedCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Attendance - {sessionName}
          </DialogTitle>
          <div className="flex gap-2 pt-2">
            <Badge variant="default" className="bg-green-600">
              {attendedCount} Attended
            </Badge>
            <Badge variant="destructive">
              {absentCount} Absent
            </Badge>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Attendees List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No matching attendees found" : "No bookings for this session"}
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const name = booking.user?.name || booking.guestName;
              const email = booking.user?.email || booking.guestEmail;
              const phone = booking.user?.phone || booking.guestPhone;
              const hasFlexi = !!booking.sessionUsage;
              const isAttended = localAttendance[booking.id] ?? booking.attended;

              return (
                <div
                  key={booking.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isAttended
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                      : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{name}</span>
                        {hasFlexi && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Flexi
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{email}</span>
                      </div>
                      {phone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {phone}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm font-medium ${
                        isAttended ? "text-green-600" : "text-red-600"
                      }`}>
                        {isAttended ? "Attended" : "Absent"}
                      </span>
                      <Switch
                        checked={isAttended}
                        onCheckedChange={() => handleToggleAttendance(booking.id, isAttended)}
                        disabled={markAttendance.isPending}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Toggle the switch to mark attendance. Flexi pack sessions will be automatically refunded when marked absent.
        </div>
      </DialogContent>
    </Dialog>
  );
}

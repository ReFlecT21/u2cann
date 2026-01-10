"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser, SignIn } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@adh/ui/ui/dialog";
import { Button } from "@adh/ui/ui/button";
import { Input } from "@adh/ui/ui/input";
import { Label } from "@adh/ui/ui/label";
import { toast } from "@adh/ui/ui/toast";
import {
  Check,
  Copy,
  Loader2,
  Calendar,
  Clock,
  User,
  Users,
  LogIn,
  CreditCard,
  Infinity,
  AlertCircle,
} from "lucide-react";
import { api } from "~/trpc/react";
import { SpotsBadge } from "./SpotsBadge";

const bookingSchema = z.object({
  guestName: z.string().min(1, "Name is required"),
  guestEmail: z.string().email("Valid email is required"),
  guestPhone: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  session: {
    id: string;
    startTime: Date;
    endTime: Date;
    capacity: number;
    bookedCount: number;
    classType: {
      displayName: string;
      description?: string | null;
      duration: number;
      isOpenGym: boolean;
    };
    instructor: {
      name: string;
    };
    branch: {
      name: string;
      location: string;
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ session, isOpen, onClose }: BookingModalProps) {
  const [step, setStep] = useState<
    "details" | "auth" | "form" | "success"
  >("details");
  const [confirmationCode, setConfirmationCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const { user, isSignedIn, isLoaded } = useUser();
  const utils = api.useUtils();

  // Check membership status (only when signed in)
  const { data: membership, isLoading: membershipLoading } =
    api.gym.public.checkMembership.useQuery(undefined, {
      enabled: isSignedIn === true,
    });

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestName: "",
      guestEmail: "",
      guestPhone: "",
    },
  });

  // Pre-fill form when user is signed in
  useEffect(() => {
    if (isSignedIn && user) {
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ");
      const email = user.primaryEmailAddress?.emailAddress || "";
      form.setValue("guestName", fullName);
      form.setValue("guestEmail", email);
    }
  }, [isSignedIn, user, form]);

  // Guest booking mutation
  const createGuestBooking = api.gym.public.createBooking.useMutation({
    onSuccess: (data) => {
      setConfirmationCode(data.confirmationCode);
      setStep("success");
      toast.success("Booking confirmed!");
      utils.gym.public.getWeeklySchedule.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Authenticated booking mutation
  const createAuthBooking =
    api.gym.public.createAuthenticatedBooking.useMutation({
      onSuccess: (data) => {
        setConfirmationCode(data.confirmationCode);
        setStep("success");
        toast.success("Booking confirmed!");
        utils.gym.public.getWeeklySchedule.invalidate();
        utils.gym.public.checkMembership.invalidate();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const handleClose = () => {
    setStep("details");
    form.reset();
    setConfirmationCode("");
    setCopied(false);
    onClose();
  };

  const handleBook = () => {
    if (isSignedIn && membership?.isValid) {
      // User is signed in with valid membership - book directly
      if (!session) return;
      createAuthBooking.mutate({
        sessionId: session.id,
        notes: "",
      });
    } else if (isSignedIn && !membership?.isValid) {
      // User is signed in but no valid membership - show error
      toast.error("You need an active membership to book classes.");
    } else {
      // Not signed in - show auth step
      setStep("auth");
    }
  };

  const handleGuestBooking = () => {
    setStep("form");
  };

  const onSubmit = (data: BookingForm) => {
    if (!session) return;
    createGuestBooking.mutate({
      sessionId: session.id,
      ...data,
    });
  };

  const copyConfirmationCode = async () => {
    await navigator.clipboard.writeText(confirmationCode);
    setCopied(true);
    toast.success("Confirmation code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!session) return null;

  const availableSpots = session.capacity - session.bookedCount;
  const isFull = availableSpots <= 0;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isPending =
    createGuestBooking.isPending || createAuthBooking.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "success"
              ? "Booking Confirmed!"
              : step === "auth"
                ? "Sign In to Book"
                : session.classType.displayName}
          </DialogTitle>
          {step === "auth" && (
            <DialogDescription>
              Sign in with your membership to book this class
            </DialogDescription>
          )}
        </DialogHeader>

        {step === "details" && (
          <div className="space-y-4">
            {/* Membership Status for signed-in users */}
            {isSignedIn && isLoaded && (
              <div className="border rounded-lg p-3 bg-gray-50">
                {membershipLoading ? (
                  <div className="animate-pulse h-6 bg-gray-200 rounded w-32" />
                ) : membership?.isValid ? (
                  <div className="flex items-center gap-2">
                    {membership.type === "subscription" ? (
                      <>
                        <Infinity className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Unlimited membership active
                        </span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          {membership.sessionsRemaining} sessions remaining
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                      No active membership
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Session Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(session.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <span>
                  {session.classType.isOpenGym
                    ? "Self-Guided"
                    : session.instructor.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <SpotsBadge
                  availableSpots={availableSpots}
                  capacity={session.capacity}
                />
              </div>
            </div>

            {session.classType.description && (
              <p className="text-sm text-gray-500">
                {session.classType.description}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleBook}
                disabled={isFull || isPending}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : isFull ? (
                  "Class Full"
                ) : isSignedIn && membership?.isValid ? (
                  "Book Now"
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In to Book
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "auth" && (
          <div className="space-y-4">
            {/* Sign In Component */}
            <div className="flex justify-center">
              <SignIn
                routing="hash"
                afterSignInUrl="/schedule"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none p-0",
                    headerTitle: "text-lg",
                    headerSubtitle: "text-gray-500 text-sm",
                    formButtonPrimary: "bg-gray-900 hover:bg-gray-800",
                  },
                }}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            {/* Guest Booking Option */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleGuestBooking}
                className="w-full"
              >
                Continue as Guest
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                Book without signing in (membership not applied)
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={() => setStep("details")}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {step === "form" && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guestName">Full Name *</Label>
              <Input
                id="guestName"
                {...form.register("guestName")}
                placeholder="Enter your full name"
              />
              {form.formState.errors.guestName && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.guestName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestEmail">Email *</Label>
              <Input
                id="guestEmail"
                type="email"
                {...form.register("guestEmail")}
                placeholder="Enter your email"
              />
              {form.formState.errors.guestEmail && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.guestEmail.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestPhone">Phone (optional)</Label>
              <Input
                id="guestPhone"
                type="tel"
                {...form.register("guestPhone")}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("auth")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={createGuestBooking.isPending}
                className="flex-1"
              >
                {createGuestBooking.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>

            <div className="space-y-2">
              <p className="text-gray-600">
                Your spot for <strong>{session.classType.displayName}</strong>{" "}
                on {formatDate(session.startTime)} at{" "}
                {formatTime(session.startTime)} has been confirmed.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-500">Confirmation Code</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-lg font-mono font-bold">
                  {confirmationCode}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyConfirmationCode}
                  className="h-8 w-8 p-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Save this code to manage your booking
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

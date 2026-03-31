"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@adh/ui/ui/dialog";
import { Input } from "@adh/ui/ui/input";
import { Label } from "@adh/ui/ui/label";
import { Button } from "@adh/ui/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@adh/ui/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@adh/ui/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";
import { UserPlus, Loader2, Check, ChevronsUpDown } from "lucide-react";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", details: "Cash" },
  { value: "paynow", label: "PayNow", details: "PayNow" },
  { value: "bank_transfer", label: "Bank Transfer", details: "Bank Transfer" },
  { value: "card", label: "Card", details: "Card" },
  { value: "grabpay", label: "GrabPay", details: "GrabPay" },
] as const;
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@adh/ui";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [planPopoverOpen, setPlanPopoverOpen] = useState(false);
  const [customSessions, setCustomSessions] = useState<string>("");
  const [customPlanName, setCustomPlanName] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expiryDate, setExpiryDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Fetch membership plans from database
  const { data: plans = [] } = api.gym.users.getMembershipPlans.useQuery();

  const utils = api.useUtils();

  const createMember = api.gym.users.createMember.useMutation({
    onSuccess: () => {
      toast.success("Member created successfully");
      utils.gym.users.getAll.invalidate();
      utils.gym.users.getStats.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create member");
    },
  });

  // Reset form when dialog closes
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setSelectedPlanId("");
    setPlanPopoverOpen(false);
    setCustomSessions("");
    setCustomPlanName("");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setExpiryDate("");
    setAmountPaid("");
    setPaymentMethod("");
  };

  // Get selected plan from database
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Auto-fill fields when plan is selected
  useEffect(() => {
    if (selectedPlan) {
      // Set amount paid from plan price
      setAmountPaid((selectedPlan.priceInCents / 100).toString());

      // Calculate expiry date based on plan
      const start = new Date(startDate);
      if (selectedPlan.category === "FLEXI_PACKAGE" || selectedPlan.category === "TRIAL") {
        // Flexi packages expire in 6 months by default
        const expiry = new Date(start);
        expiry.setMonth(expiry.getMonth() + 6);
        setExpiryDate(format(expiry, "yyyy-MM-dd"));
      } else if (selectedPlan.category === "MONTHLY_SUBSCRIPTION") {
        // Monthly subscriptions - use commitment months from plan
        const expiry = new Date(start);
        expiry.setMonth(expiry.getMonth() + (selectedPlan.commitmentMonths ?? 1));
        setExpiryDate(format(expiry, "yyyy-MM-dd"));
      }
    }
  }, [selectedPlanId, startDate, selectedPlan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!selectedPlanId) {
      toast.error("Please select a membership plan");
      return;
    }

    const selectedPaymentMethod = PAYMENT_METHODS.find((pm) => pm.value === paymentMethod);

    createMember.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      planId: selectedPlanId,
      sessionsIncluded: selectedPlan?.sessionsIncluded ?? null,
      startDate: new Date(startDate),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      amountPaidCents: amountPaid ? Math.round(parseFloat(amountPaid) * 100) : 0,
      paymentMethod: paymentMethod || undefined,
      paymentMethodDetails: selectedPaymentMethod?.details || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Member
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label>Membership Plan *</Label>
            <Popover open={planPopoverOpen} onOpenChange={setPlanPopoverOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={planPopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedPlan?.name || "Search plans..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start" side="bottom" sideOffset={4}>
                <Command>
                  <CommandInput placeholder="Search plans..." />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty>No plan found.</CommandEmpty>
                    <CommandGroup>
                      {plans.map((plan) => (
                        <CommandItem
                          key={plan.id}
                          value={plan.name}
                          onSelect={() => {
                            setSelectedPlanId(plan.id);
                            setPlanPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPlanId === plan.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{plan.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ${(plan.priceInCents / 100).toFixed(2)} • {plan.sessionsIncluded ? `${plan.sessionsIncluded} sessions` : "Unlimited"}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedPlan && (
              <p className="text-xs text-muted-foreground">
                {selectedPlan.sessionsIncluded
                  ? `${selectedPlan.sessionsIncluded} sessions`
                  : "Unlimited sessions"}{" "}
                • {selectedPlan.category.replace("_", " ")}
              </p>
            )}
          </div>

          {/* Custom Plan Fields - removed since we're using DB plans */}
          {false && (
            <>
              <div className="space-y-2">
                <Label htmlFor="customPlanName">Custom Plan Name</Label>
                <Input
                  id="customPlanName"
                  value={customPlanName}
                  onChange={(e) => setCustomPlanName(e.target.value)}
                  placeholder="e.g., Special Promo Package"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customSessions">Number of Sessions (leave empty for unlimited)</Label>
                <Input
                  id="customSessions"
                  type="number"
                  min="1"
                  value={customSessions}
                  onChange={(e) => setCustomSessions(e.target.value)}
                  placeholder="e.g., 10"
                />
              </div>
            </>
          )}

          {/* Date Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Amount Paid and Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount Paid (SGD)</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMember.isPending}>
              {createMember.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

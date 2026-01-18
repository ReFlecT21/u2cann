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
import { UserPlus, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { STRIPE_PRODUCT_TO_PLAN } from "~/config/stripe-products";
import { format } from "date-fns";
import { cn } from "@adh/ui";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Get product options from stripe config
const productOptions = Object.entries(STRIPE_PRODUCT_TO_PLAN).map(([productId, config]) => ({
  id: productId,
  name: config.name,
  planType: config.planType,
  category: config.category,
  sessionsIncluded: config.sessionsIncluded,
  priceInCents: config.priceInCents,
  flexiExpiryMonths: config.flexiExpiryMonths,
}));

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const [customSessions, setCustomSessions] = useState<string>("");
  const [customPlanName, setCustomPlanName] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expiryDate, setExpiryDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

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
    setSelectedProduct("");
    setProductPopoverOpen(false);
    setCustomSessions("");
    setCustomPlanName("");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setExpiryDate("");
    setAmountPaid("");
  };

  // Auto-fill fields when product is selected
  useEffect(() => {
    if (selectedProduct && selectedProduct !== "custom") {
      const product = productOptions.find((p) => p.id === selectedProduct);
      if (product) {
        // Set amount paid from product price
        setAmountPaid((product.priceInCents / 100).toString());

        // Calculate expiry date based on product
        const start = new Date(startDate);
        if (product.category === "FLEXI_PACKAGE" || product.category === "TRIAL") {
          // Flexi packages expire in X months
          const months = product.flexiExpiryMonths || 6;
          const expiry = new Date(start);
          expiry.setMonth(expiry.getMonth() + months);
          setExpiryDate(format(expiry, "yyyy-MM-dd"));
        } else if (product.category === "MONTHLY_SUBSCRIPTION") {
          // Monthly subscriptions - set to 1 month from start
          const expiry = new Date(start);
          expiry.setMonth(expiry.getMonth() + 1);
          setExpiryDate(format(expiry, "yyyy-MM-dd"));
        }
      }
    }
  }, [selectedProduct, startDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    const isCustom = selectedProduct === "custom";
    const product = isCustom ? null : productOptions.find((p) => p.id === selectedProduct);

    createMember.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      productId: isCustom ? null : selectedProduct,
      customPlanName: isCustom ? customPlanName.trim() : null,
      customSessions: isCustom && customSessions ? parseInt(customSessions) : null,
      sessionsIncluded: product?.sessionsIncluded ?? (isCustom && customSessions ? parseInt(customSessions) : null),
      startDate: new Date(startDate),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      amountPaidCents: amountPaid ? Math.round(parseFloat(amountPaid) * 100) : 0,
    });
  };

  const selectedProductConfig = selectedProduct && selectedProduct !== "custom"
    ? productOptions.find((p) => p.id === selectedProduct)
    : null;

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

          {/* Product Selection */}
          <div className="space-y-2">
            <Label>Membership Plan *</Label>
            <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productPopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedProduct === "custom"
                    ? "Custom (Manual Entry)"
                    : selectedProduct
                      ? productOptions.find((p) => p.id === selectedProduct)?.name
                      : "Search plans..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search plans..." />
                  <CommandList>
                    <CommandEmpty>No plan found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="custom"
                        onSelect={() => {
                          setSelectedProduct("custom");
                          setProductPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedProduct === "custom" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Custom (Manual Entry)
                      </CommandItem>
                      {productOptions.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={() => {
                            setSelectedProduct(product.id);
                            setProductPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProduct === product.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ${(product.priceInCents / 100).toFixed(2)} • {product.sessionsIncluded ? `${product.sessionsIncluded} sessions` : "Unlimited"}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedProductConfig && (
              <p className="text-xs text-muted-foreground">
                {selectedProductConfig.sessionsIncluded
                  ? `${selectedProductConfig.sessionsIncluded} sessions`
                  : "Unlimited sessions"}{" "}
                • {selectedProductConfig.category.replace("_", " ")}
              </p>
            )}
          </div>

          {/* Custom Plan Fields */}
          {selectedProduct === "custom" && (
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

          {/* Amount Paid */}
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

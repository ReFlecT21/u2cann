"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "@adh/ui/ui/button";
import { Input } from "@adh/ui/ui/input";
import { Label } from "@adh/ui/ui/label";
import { Badge } from "@adh/ui/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@adh/ui/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@adh/ui/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adh/ui/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@adh/ui/ui/dialog";
import { toast } from "sonner";
import { AdminGuard } from "../../components/AdminGuard";

// ---------------------------------------------------------------------------
// Credit packs
// ---------------------------------------------------------------------------
type Pack = {
  id: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  name: string;
  creditsGranted: number;
  priceInCents: number;
  isActive: boolean;
};

function emptyPack() {
  return {
    id: "",
    name: "",
    stripeProductId: "",
    stripePriceId: "",
    creditsGranted: 10,
    priceInCents: 0,
    isActive: true,
  };
}

function PacksTab() {
  const ctx = api.useContext();
  const { data: packs = [] } = api.gym.credits.listProducts.useQuery();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ReturnType<typeof emptyPack>>(emptyPack());
  const isEdit = !!draft.id;

  const create = api.gym.credits.createProduct.useMutation({
    onSuccess: () => {
      toast.success("Credit pack created");
      void ctx.gym.credits.listProducts.invalidate();
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const update = api.gym.credits.updateProduct.useMutation({
    onSuccess: () => {
      toast.success("Credit pack updated");
      void ctx.gym.credits.listProducts.invalidate();
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = api.gym.credits.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success("Credit pack deactivated");
      void ctx.gym.credits.listProducts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function save() {
    if (
      !draft.name ||
      (!draft.stripeProductId && !draft.stripePriceId) ||
      draft.creditsGranted < 1
    ) {
      toast.error("Name, a Stripe product OR price ID, and credits are required");
      return;
    }
    const payload = {
      name: draft.name,
      stripeProductId: draft.stripeProductId || undefined,
      stripePriceId: draft.stripePriceId || undefined,
      creditsGranted: draft.creditsGranted,
      priceInCents: draft.priceInCents,
      isActive: draft.isActive,
    };
    if (isEdit) {
      update.mutate({ id: draft.id, ...payload });
    } else {
      create.mutate(payload);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Credit packs</CardTitle>
        <Button
          onClick={() => {
            setDraft(emptyPack());
            setOpen(true);
          }}
        >
          Add pack
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          When a member buys one of these Stripe products, the credits land in
          their wallet. No membership or door access is granted.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Stripe product / price ID</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No credit packs yet.
                </TableCell>
              </TableRow>
            )}
            {packs.map((p: Pack) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="font-mono text-xs">
                  {p.stripeProductId ?? p.stripePriceId ?? "—"}
                </TableCell>
                <TableCell className="text-right">{p.creditsGranted}</TableCell>
                <TableCell className="text-right">
                  ${(p.priceInCents / 100).toFixed(2)}
                </TableCell>
                <TableCell>
                  {p.isActive ? (
                    <Badge variant="secondary">Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDraft({
                        id: p.id,
                        name: p.name,
                        stripeProductId: p.stripeProductId ?? "",
                        stripePriceId: p.stripePriceId ?? "",
                        creditsGranted: p.creditsGranted,
                        priceInCents: p.priceInCents,
                        isActive: p.isActive,
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  {p.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove.mutate({ id: p.id })}
                    >
                      Deactivate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit" : "Add"} credit pack</DialogTitle>
            <DialogDescription>
              Maps a Stripe product to a credit grant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="10-Class Credit Pack"
              />
            </div>
            <div>
              <Label>Stripe product ID</Label>
              <Input
                value={draft.stripeProductId}
                onChange={(e) =>
                  setDraft({ ...draft, stripeProductId: e.target.value })
                }
                placeholder="prod_..."
              />
            </div>
            <div>
              <Label>Stripe price ID (optional)</Label>
              <Input
                value={draft.stripePriceId}
                onChange={(e) =>
                  setDraft({ ...draft, stripePriceId: e.target.value })
                }
                placeholder="price_..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fill in either the product ID or the price ID — purchases match
                on whichever is set.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Credits granted</Label>
                <Input
                  type="number"
                  min={1}
                  value={draft.creditsGranted}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      creditsGranted: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Price (SGD)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.priceInCents / 100}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      priceInCents: Math.round(Number(e.target.value) * 100),
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={save}
              disabled={create.isPending || update.isPending}
            >
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Per-class-type credit cost
// ---------------------------------------------------------------------------
function ClassCostsTab() {
  const ctx = api.useContext();
  const { data: classTypes = [] } = api.gym.credits.listClassTypeCosts.useQuery();
  const setCost = api.gym.credits.setClassTypeCost.useMutation({
    onSuccess: () => {
      toast.success("Credit cost updated");
      void ctx.gym.credits.listClassTypeCosts.invalidate();
      void ctx.gym.classTypes.getAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit cost per class type</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          How many credits a credit-pack member spends to book each class type.
          Membership/flexi bookings are unaffected.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class type</TableHead>
              <TableHead className="w-40">Credit cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classTypes.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.displayName}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    defaultValue={c.creditCost}
                    className="w-24"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== c.creditCost && v >= 0) {
                        setCost.mutate({ classTypeId: c.id, creditCost: v });
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Member wallet lookup + adjust
// ---------------------------------------------------------------------------
function MemberWalletTab() {
  const ctx = api.useContext();
  const [userId, setUserId] = useState("");
  const [activeUserId, setActiveUserId] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");

  const { data, isFetching } = api.gym.credits.getUserCredits.useQuery(
    { userId: activeUserId },
    { enabled: !!activeUserId }
  );

  const adjust = api.gym.credits.adjustUserCredits.useMutation({
    onSuccess: (r) => {
      toast.success(`Balance is now ${r.balance}`);
      setAmount(0);
      setReason("");
      void ctx.gym.credits.getUserCredits.invalidate({ userId: activeUserId });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label>User ID</Label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Clerk user id"
            />
          </div>
          <Button onClick={() => setActiveUserId(userId.trim())}>Look up</Button>
        </div>

        {activeUserId && (
          <>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Balance</div>
              <div className="text-3xl font-bold">
                {isFetching ? "…" : data?.balance ?? 0}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  credits
                </span>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="w-32">
                <Label>Adjust (+/-)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <Label>Reason</Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. comp / correction"
                />
              </div>
              <Button
                disabled={!amount || !reason || adjust.isPending}
                onClick={() =>
                  adjust.mutate({ userId: activeUserId, amount, reason })
                }
              >
                Apply
              </Button>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Recent transactions</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.transactions ?? []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.type}</Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          t.amount < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {t.amount > 0 ? "+" : ""}
                        {t.amount}
                      </TableCell>
                      <TableCell className="text-right">
                        {t.balanceAfter}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.reason ?? t.product?.name ?? ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function CreditsAdminPage() {
  return (
    <AdminGuard>
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Credits</h1>
        <p className="text-muted-foreground">
          Manage credit packs, per-class credit costs, and member balances.
        </p>
      </header>
      <Tabs defaultValue="packs">
        <TabsList>
          <TabsTrigger value="packs">Packs</TabsTrigger>
          <TabsTrigger value="costs">Class costs</TabsTrigger>
          <TabsTrigger value="wallet">Member wallet</TabsTrigger>
        </TabsList>
        <TabsContent value="packs" className="mt-4">
          <PacksTab />
        </TabsContent>
        <TabsContent value="costs" className="mt-4">
          <ClassCostsTab />
        </TabsContent>
        <TabsContent value="wallet" className="mt-4">
          <MemberWalletTab />
        </TabsContent>
      </Tabs>
    </AdminGuard>
  );
}

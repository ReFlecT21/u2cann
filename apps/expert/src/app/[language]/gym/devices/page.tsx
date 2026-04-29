"use client";

import { useState } from "react";
import { format } from "date-fns";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@adh/ui/ui/card";
import { Button } from "@adh/ui/ui/button";
import { Badge } from "@adh/ui/ui/badge";
import { Input } from "@adh/ui/ui/input";
import { Label } from "@adh/ui/ui/label";
import { Textarea } from "@adh/ui/ui/text-area";
import { Switch } from "@adh/ui/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@adh/ui/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adh/ui/ui/table";
import { Skeleton } from "@adh/ui/ui/skeleton";
import { toast } from "sonner";
import {
  Camera,
  Plug,
  Pencil,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AdminGuard } from "../../components/AdminGuard";

interface DeviceRow {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  username: string;
  hasPassword: boolean;
  isActive: boolean;
  lastSyncedAt: Date | null;
  notes: string | null;
}

interface DeviceFormState {
  id?: string;
  name: string;
  ipAddress: string;
  port: string;
  username: string;
  password: string;
  isActive: boolean;
  notes: string;
}

const emptyForm: DeviceFormState = {
  name: "",
  ipAddress: "",
  port: "80",
  username: "admin",
  password: "",
  isActive: true,
  notes: "",
};

export default function HikvisionDevicesPage() {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DeviceFormState>(emptyForm);
  const [deleting, setDeleting] = useState<DeviceRow | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: devices, isLoading } =
    api.gym.hikvisionDevices.list.useQuery();

  const createMut = api.gym.hikvisionDevices.create.useMutation({
    onSuccess: () => {
      toast.success("Device added");
      void utils.gym.hikvisionDevices.list.invalidate();
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.message || "Failed to add device"),
  });

  const updateMut = api.gym.hikvisionDevices.update.useMutation({
    onSuccess: () => {
      toast.success("Device updated");
      void utils.gym.hikvisionDevices.list.invalidate();
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.message || "Failed to update device"),
  });

  const deleteMut = api.gym.hikvisionDevices.delete.useMutation({
    onSuccess: () => {
      toast.success("Device removed");
      void utils.gym.hikvisionDevices.list.invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(err.message || "Failed to remove device"),
  });

  const testMut = api.gym.hikvisionDevices.testConnection.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Connection successful");
      } else {
        toast.error(data.error || "Connection failed");
      }
      setTestingId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Test failed");
      setTestingId(null);
    },
  });

  const openCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (d: DeviceRow) => {
    setForm({
      id: d.id,
      name: d.name,
      ipAddress: d.ipAddress,
      port: String(d.port),
      username: d.username,
      password: "",
      isActive: d.isActive,
      notes: d.notes ?? "",
    });
    setOpen(true);
  };

  const submit = () => {
    const port = parseInt(form.port, 10);
    if (!form.name || !form.ipAddress || !form.username) {
      toast.error("Name, IP, and username are required");
      return;
    }
    if (!form.id && !form.password) {
      toast.error("Password is required for new devices");
      return;
    }
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      toast.error("Port must be between 1 and 65535");
      return;
    }

    if (form.id) {
      updateMut.mutate({
        id: form.id,
        name: form.name,
        ipAddress: form.ipAddress,
        port,
        username: form.username,
        password: form.password || undefined,
        isActive: form.isActive,
        notes: form.notes || undefined,
      });
    } else {
      createMut.mutate({
        name: form.name,
        ipAddress: form.ipAddress,
        port,
        username: form.username,
        password: form.password,
        isActive: form.isActive,
        notes: form.notes || undefined,
      });
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <AdminGuard>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Camera className="h-6 w-6" />
              Hikvision Devices
            </h1>
            <p className="text-muted-foreground">
              Face recognition terminals registered for door access
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </header>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>IP : Port</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last sync</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!devices || devices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No devices registered yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    devices.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {d.ipAddress}:{d.port}
                        </TableCell>
                        <TableCell>{d.username}</TableCell>
                        <TableCell>
                          {d.isActive ? (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {d.lastSyncedAt
                            ? format(new Date(d.lastSyncedAt), "MMM d, HH:mm")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTestingId(d.id);
                                testMut.mutate({ id: d.id });
                              }}
                              disabled={testingId === d.id}
                            >
                              {testingId === d.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plug className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(d)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleting(d)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Setup checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>1. Run the bridge service on a PC inside the gym LAN</p>
            <p>2. Set <code>HIKVISION_BRIDGE_URL</code> and <code>HIKVISION_BRIDGE_SECRET</code> on the cloud app</p>
            <p>3. Set <code>HIKVISION_ENCRYPTION_KEY</code> (any 64-char hex string) for password storage</p>
            <p>4. Add each camera here with its local IP, admin user/password</p>
            <p>5. Click the plug icon to verify the bridge can reach the camera</p>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {form.id ? "Edit device" : "Add Hikvision device"}
              </DialogTitle>
              <DialogDescription>
                Camera credentials are encrypted before being stored.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Main Entrance"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="ip">IP address</Label>
                  <Input
                    id="ip"
                    value={form.ipAddress}
                    onChange={(e) =>
                      setForm({ ...form, ipAddress: e.target.value })
                    }
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="password">
                  Password{" "}
                  {form.id && (
                    <span className="text-xs text-muted-foreground">
                      (leave blank to keep existing)
                    </span>
                  )}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {form.id ? "Save changes" : "Add device"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove device?</DialogTitle>
              <DialogDescription>
                {deleting?.name} ({deleting?.ipAddress}) will no longer receive
                face syncs. Existing faces on the camera are not affected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleting && deleteMut.mutate({ id: deleting.id })}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}

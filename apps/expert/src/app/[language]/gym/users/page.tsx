"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@adh/ui/ui/card";
import { Input } from "@adh/ui/ui/input";
import { Badge } from "@adh/ui/ui/badge";
import { Button } from "@adh/ui/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adh/ui/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";
import { Skeleton } from "@adh/ui/ui/skeleton";
import { Users, UserCheck, Shield, Dumbbell, CreditCard, Search, UserPlus } from "lucide-react";
import { AdminGuard } from "../../components/AdminGuard";
import { AddMemberDialog } from "./AddMemberDialog";

function getMembershipStatusColor(status: string | undefined) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500";
    case "EXPIRED":
      return "bg-red-500";
    case "CANCELLED":
      return "bg-gray-500";
    case "PAUSED":
      return "bg-yellow-500";
    case "PENDING_PAYMENT":
      return "bg-orange-500";
    default:
      return "bg-gray-400";
  }
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "admin":
      return "destructive";
    case "coach":
      return "default";
    case "trainee":
      return "secondary";
    default:
      return "outline";
  }
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const { data: users, isLoading } = api.gym.users.getAll.useQuery({
    search: search || undefined,
    role: roleFilter !== "all" ? (roleFilter as "admin" | "coach" | "trainee") : undefined,
  });

  const { data: stats } = api.gym.users.getStats.useQuery();

  return (
    <AdminGuard>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground">
              Manage users and view membership information
            </p>
          </div>
          <Button onClick={() => setAddMemberOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </header>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.adminCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coaches</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.coachCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trainees</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.traineeCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Memberships</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeMemberships ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="trainee">Trainee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Signed Up</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name || "—"}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role) as any}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.membership ? (
                            <div className="text-sm">
                              <div className="font-medium">{user.membership.planName}</div>
                              <div className="text-muted-foreground text-xs">
                                {user.membership.category.replace("_", " ")}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No membership</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.membership ? (
                            <Badge
                              className={`${getMembershipStatusColor(user.membership.status)} text-white`}
                            >
                              {user.membership.status}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {user.membership?.paymentMethodDetails ? (
                            <span className="text-sm">{user.membership.paymentMethodDetails}</span>
                          ) : user.membership?.paymentMethod ? (
                            <span className="text-sm capitalize">{user.membership.paymentMethod}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.membership?.category === "FLEXI_PACKAGE" ? (
                            <span>
                              {user.membership.sessionsRemaining ?? 0} remaining
                              <span className="text-muted-foreground text-xs block">
                                ({user.membership.sessionsUsed ?? 0} used)
                              </span>
                            </span>
                          ) : user.membership?.category === "MONTHLY_SUBSCRIPTION" ? (
                            <span className="text-muted-foreground">Unlimited</span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.membership?.expiresAt ? (
                            <div className="text-sm">
                              {format(new Date(user.membership.expiresAt), "MMM d, yyyy")}
                            </div>
                          ) : user.membership?.currentPeriodEnd ? (
                            <div className="text-sm">
                              {format(new Date(user.membership.currentPeriodEnd), "MMM d, yyyy")}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">{user.totalBookings}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.confirmedBookings} active
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

        {/* Add Member Dialog */}
        <AddMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} />
      </div>
    </AdminGuard>
  );
}

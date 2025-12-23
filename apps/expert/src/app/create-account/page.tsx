"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@adh/ui/ui/input";
import { Button } from "@adh/ui/ui/button";
import { api } from "~/trpc/react";
import { routerPush } from "~/utils/router";

export default function CreateAccountPage() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(false);

  const { mutateAsync: createTeam } =
    api.registration.admin.createTeam.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim()) return;
    setLoading(true);
    try {
      await createTeam({ name: clinicName });
      routerPush(router, `/create-account/branch`, true);
    } catch (err) {
      console.error("Failed to create clinic team:", err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-6">
      <h1 className="text-xl font-bold">Create Your Clinic</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Enter clinic name"
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create Clinic"}
        </Button>
      </form>
    </div>
  );
}

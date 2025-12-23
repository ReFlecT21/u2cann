"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@adh/ui/ui/input";
import { Button } from "@adh/ui/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";
import { api } from "~/trpc/react";
import { useCurrentLocale } from "next-i18n-router/client";
import { i18nConfig } from "@adh/ui/i18nConfig";

export default function InviteCliniciansPage() {
  const router = useRouter();
  const currentLocale = useCurrentLocale(i18nConfig);

  const [clinicians, setClinicians] = useState([
    { email: "", specialty: "", branchId: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const { data: branches = [] } = api.registration.admin.getBranches.useQuery();
  const { mutateAsync: inviteClinician } =
    api.registration.admin.inviteClinician.useMutation();

  const handleChange = (
    index: number,
    field: "email" | "specialty" | "branchId",
    value: string,
  ) => {
    const updated = [...clinicians];
    if (updated[index]) {
      updated[index][field] = value;
    }
    setClinicians(updated);
  };

  const addClinician = () => {
    setClinicians([...clinicians, { email: "", specialty: "", branchId: "" }]);
  };

  const removeClinician = (index: number) => {
    if (clinicians.length === 1) return;
    setClinicians(clinicians.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !clinicians.every(
        (c) =>
          c.email.trim() &&
          c.specialty.trim() &&
          (branches.length === 1 || c.branchId),
      )
    )
      return;

    setLoading(true);
    try {
      for (const c of clinicians) {
        await inviteClinician({
          email: c.email,
          specialty: c.specialty,
          branchId:
            branches.length === 1 ? (branches[0]?.id ?? "") : c.branchId,
        });
      }
      router.push(`/${currentLocale}/overview`);
    } catch (error) {
      console.error("Failed to invite clinicians:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-6">
      <h1 className="text-xl font-bold">Invite Clinicians</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {clinicians.map((clinician, index) => (
          <div key={index} className="space-y-2 border p-4 rounded-md">
            <Input
              placeholder="Clinician Email"
              value={clinician.email}
              onChange={(e) => handleChange(index, "email", e.target.value)}
            />
            <Input
              placeholder="Clinician Specialty"
              value={clinician.specialty}
              onChange={(e) => handleChange(index, "specialty", e.target.value)}
            />
            {branches.length > 1 && (
              <Select
                onValueChange={(value) =>
                  handleChange(index, "branchId", value)
                }
                value={clinician.branchId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {clinicians.length > 1 && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeClinician(index)}
              >
                Remove Clinician
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={addClinician}>
          Add Clinician
        </Button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${currentLocale}/overview`)}
          >
            Skip
          </Button>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Inviting..." : "Submit Invitations"}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@adh/ui/ui/input";
import { Button } from "@adh/ui/ui/button";
import { api } from "~/trpc/react";

export default function CreateAdminAccountPage() {
  const router = useRouter();

  const [branches, setBranches] = useState([{ name: "", location: "" }]);
  const [loading, setLoading] = useState(false);
  const { mutateAsync: createBranch } =
    api.registration.admin.createBranch.useMutation();

  const handleChange = (
    index: number,
    field: "name" | "location",
    value: string,
  ) => {
    const newBranches = [...branches];
    if (newBranches[index]) {
      newBranches[index][field] = value;
      setBranches(newBranches);
    }
  };

  const addBranch = () => {
    setBranches([...branches, { name: "", location: "" }]);
  };

  const removeBranch = (index: number) => {
    if (branches.length === 1) return;
    setBranches(branches.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branches.every((b) => b.name.trim() && b.location.trim())) return;

    setLoading(true);
    try {
      for (const branch of branches) {
        await createBranch(branch);
      }
      router.push(`/create-account/clinicians`);
    } catch (error) {
      console.error("Failed to create branches:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-6">
      <h1 className="text-xl font-bold">Set Up Branches</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {branches.map((branch, index) => (
          <div key={index} className="space-y-2 border p-4 rounded-md">
            <Input
              placeholder="Branch name"
              value={branch.name}
              onChange={(e) => handleChange(index, "name", e.target.value)}
            />
            <Input
              placeholder="Branch location"
              value={branch.location}
              onChange={(e) => handleChange(index, "location", e.target.value)}
            />
            {branches.length > 1 && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeBranch(index)}
              >
                Remove branch
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={addBranch}>
          Add another branch
        </Button>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Submit and continue"}
        </Button>
      </form>
    </div>
  );
}

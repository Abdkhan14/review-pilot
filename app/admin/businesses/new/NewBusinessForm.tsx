"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@/app/tokens";
import { useCreateBusiness } from "@/hooks/useCreateBusiness";

export default function NewBusinessForm() {
  const router = useRouter();
  const { createBusiness, loading, error } = useCreateBusiness();

  const [name, setName] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [tier, setTier] = useState<"BASIC" | "SAAS" | "">("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: string[] = [];
    if (!name.trim()) errs.push("Name is required");
    if (!placeId.trim()) errs.push("Place ID is required");
    if (!tier) errs.push("Tier is required");

    if (errs.length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors([]);

    const result = await createBusiness({
      name: name.trim(),
      placeId: placeId.trim(),
      tier: tier as "BASIC" | "SAAS",
      ...(customInstructions.trim() ? { customInstructions: customInstructions.trim() } : {}),
    });

    if (result) {
      router.push("/admin");
    }
  }

  const displayError = fieldErrors.length > 0 ? fieldErrors.join(". ") : error;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
      <label htmlFor="name" className="text-sm font-medium">
        Name
      </label>
      <input
        id="name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={`border ${tokens.border} bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-400`}
      />

      <label htmlFor="placeId" className="text-sm font-medium">
        Place ID
      </label>
      <input
        id="placeId"
        type="text"
        value={placeId}
        onChange={(e) => setPlaceId(e.target.value)}
        className={`border ${tokens.border} bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-400`}
      />

      <label htmlFor="tier" className="text-sm font-medium">
        Tier
      </label>
      <select
        id="tier"
        value={tier}
        onChange={(e) => setTier(e.target.value as "BASIC" | "SAAS" | "")}
        className={`border ${tokens.border} bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-400`}
      >
        <option value="">Select tier</option>
        <option value="BASIC">BASIC</option>
        <option value="SAAS">SAAS</option>
      </select>

      <label htmlFor="customInstructions" className="text-sm font-medium">
        Custom instructions (optional)
      </label>
      <textarea
        id="customInstructions"
        value={customInstructions}
        onChange={(e) => setCustomInstructions(e.target.value)}
        rows={3}
        className={`border ${tokens.border} bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-400`}
      />

      {displayError && (
        <p role="alert" className="text-sm text-red-600">
          {displayError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`border ${tokens.border} px-4 py-2 text-sm font-medium disabled:opacity-50`}
      >
        {loading ? "Saving…" : "Create business"}
      </button>
    </form>
  );
}

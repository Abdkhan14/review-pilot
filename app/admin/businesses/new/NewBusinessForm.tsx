"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@/app/tokens";
import { useCreateBusiness } from "@/hooks/useCreateBusiness";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

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
        className={`rounded-md border ${tokens.border} bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-400`}
      />

      <label htmlFor="placeId" className="text-sm font-medium">
        Place ID
      </label>
      <input
        id="placeId"
        type="text"
        value={placeId}
        onChange={(e) => setPlaceId(e.target.value)}
        className={`rounded-md border ${tokens.border} bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-400`}
      />

      <label htmlFor="tier" className="text-sm font-medium">
        Tier
      </label>
      <div className="relative">
        <select
          id="tier"
          value={tier}
          onChange={(e) => setTier(e.target.value as "BASIC" | "SAAS" | "")}
          className={`w-full appearance-none rounded-md border ${tokens.border} bg-white px-3 py-2 pr-8 text-sm outline-none focus:ring-1 focus:ring-zinc-400`}
        >
          <option value="">Select tier</option>
          <option value="BASIC">BASIC</option>
          <option value="SAAS">SAAS</option>
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
          ▾
        </span>
      </div>

      <label htmlFor="customInstructions" className="text-sm font-medium">
        Shop notes (optional)
      </label>
      <p className="text-xs text-zinc-500 -mt-2">
        Prose on any line overrides model defaults. Add item groups so the
        generator assigns a different subject to each review draft.
      </p>
      <textarea
        id="customInstructions"
        value={customInstructions}
        onChange={(e) => setCustomInstructions(e.target.value)}
        rows={8}
        placeholder={"Always mention the open kitchen.\n\n# Mains\n- Chicken Shawarma Platter\n- Mixed Grill\n\n# Sides\n- Hummus\n- Falafel\n\n# Drinks\n- Mint Tea"}
        className={`rounded-md border ${tokens.border} bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-400 font-mono`}
      />

      {displayError && (
        <Alert variant="destructive">{displayError}</Alert>
      )}

      <Button type="submit" variant="outline" disabled={loading} className="w-full">
        {loading ? "Saving…" : "Create business"}
      </Button>
    </form>
  );
}

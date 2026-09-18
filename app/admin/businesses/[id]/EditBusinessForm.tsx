"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@/app/tokens";
import { useUpdateBusiness } from "@/hooks/useUpdateBusiness";

type Props = {
  id: string;
  name: string;
  slug: string;
  initialTier: "BASIC" | "SAAS";
  initialCustomInstructions: string | null;
};

export default function EditBusinessForm({
  id,
  name,
  slug,
  initialTier,
  initialCustomInstructions,
}: Props) {
  const router = useRouter();
  const { updateBusiness, loading, error } = useUpdateBusiness();

  const [tier, setTier] = useState<"BASIC" | "SAAS" | "">(initialTier);
  const [customInstructions, setCustomInstructions] = useState(
    initialCustomInstructions ?? ""
  );
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!tier) {
      setFieldErrors(["Tier is required"]);
      return;
    }

    setFieldErrors([]);

    const result = await updateBusiness(id, {
      tier: tier as "BASIC" | "SAAS",
      customInstructions: customInstructions.trim() || null,
    });

    if (result) {
      router.push("/admin");
    }
  }

  const displayError = fieldErrors.length > 0 ? fieldErrors.join(". ") : error;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-12">
      <div>
        <p className="text-sm font-medium text-zinc-500">Name</p>
        <p className="mt-1 text-sm">{name}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-500">Slug</p>
        <p className="mt-1 font-mono text-sm text-zinc-500">{slug}</p>
      </div>

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
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@/app/tokens";
import { useUpdateBusiness } from "@/hooks/useUpdateBusiness";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Props = {
  id: string;
  name: string;
  slug: string;
  scanUrl: string;
  initialTier: "BASIC" | "SAAS";
  initialCustomInstructions: string | null;
};

export default function EditBusinessForm({
  id,
  name,
  slug,
  scanUrl,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
      <div>
        <p className="text-sm font-medium text-zinc-500">Name</p>
        <p className="mt-1 text-sm">{name}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-500">Slug</p>
        <p className="mt-1 font-mono text-sm text-zinc-500">{slug}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-500">Test link</p>
        <p className="mt-1 text-xs text-zinc-500">
          Scanning the QR code opens this page.
        </p>
        <a
          href={scanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block break-all font-mono text-sm text-zinc-700 underline"
        >
          {scanUrl}
        </a>
      </div>

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
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

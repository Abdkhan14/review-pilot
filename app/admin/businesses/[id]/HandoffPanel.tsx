"use client";

import { useState } from "react";
import { api } from "@/hooks/api";
import { tokens } from "@/app/tokens";
import { Button } from "@/components/ui/button";
import { DAILY_HANDOFF_LIMIT } from "@/lib/handoff";

type Props = {
  businessId: string;
  initialCount: number;
};

export default function HandoffPanel({ businessId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);
    try {
      await api.post(`/api/admin/businesses/${businessId}/handoff/reset`);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`mt-8 rounded-lg border ${tokens.border} bg-white p-4 shadow-sm`}>
      <h2 className="text-sm font-semibold mb-1">Handoffs today</h2>
      <p className="text-2xl font-mono mb-1">
        {count} <span className="text-zinc-400 text-base">/ {DAILY_HANDOFF_LIMIT}</span>
      </p>
      <p className="text-xs text-zinc-500 mb-4">
        Customer copied a draft then opened Google Reviews. Not confirmed posts. Day resets at UTC midnight.
      </p>
      <Button
        variant="outline"
        onClick={handleReset}
        disabled={loading || count === 0}
      >
        {loading ? "Resetting…" : "Reset today's count"}
      </Button>
    </section>
  );
}

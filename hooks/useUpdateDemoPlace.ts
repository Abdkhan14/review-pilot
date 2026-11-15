"use client";

import { useState } from "react";
import { api } from "@/hooks/api";

type Action =
  | { action: "reset" }
  | { action: "raiseLimit"; limit: number }
  | { action: "block" }
  | { action: "unblock" };

export function useUpdateDemoPlace(placeId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(action: Action): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/api/admin/demo-places/${encodeURIComponent(placeId)}`, action);
      return true;
    } catch {
      setError("Action failed. Try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { update, loading, error };
}

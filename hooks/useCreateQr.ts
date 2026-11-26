"use client";
import { useState } from "react";
import { api } from "./api";

type CreateQrInput = {
  placeId: string;
  notes: string;
  plan: "trial";
  sessionToken: string;
};

type CreateQrResult = { id: string; slug: string };

export type CreateQrError = "place_failed" | "trial_used" | "unknown";

export function useCreateQr() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CreateQrError | null>(null);

  async function createQr(input: CreateQrInput): Promise<CreateQrResult | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<CreateQrResult>("/api/app/qr", input);
      return res.data;
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(code === "place_failed" || code === "trial_used" ? code : "unknown");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { createQr, loading, error };
}

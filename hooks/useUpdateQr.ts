"use client";
import { useState } from "react";
import { api } from "./api";

type UpdateQrInput = { customInstructions: string } | { refreshPlace: true };

type UpdateQrResult = { customInstructions: string | null; detailsFetchedAt: string | null };

export function useUpdateQr(id: string) {
  const [loading, setLoading] = useState(false);

  async function updateQr(input: UpdateQrInput): Promise<UpdateQrResult | null> {
    setLoading(true);
    try {
      const res = await api.patch<UpdateQrResult>(`/api/app/qr/${id}`, input);
      return res.data;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { updateQr, loading };
}

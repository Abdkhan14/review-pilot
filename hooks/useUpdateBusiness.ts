"use client";
import { useState } from "react";
import { api } from "./api";

type UpdateInput = {
  tier: "BASIC" | "SAAS";
  customInstructions?: string | null;
};

type UpdateResult = { slug: string; tier: string };

export function useUpdateBusiness() {
  const [data, setData] = useState<UpdateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateBusiness(
    id: string,
    input: UpdateInput
  ): Promise<UpdateResult | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch<UpdateResult>(
        `/api/admin/businesses/${id}`,
        input
      );
      setData(res.data);
      return res.data;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const message = axiosErr?.response?.data?.error ?? "Something went wrong";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { updateBusiness, data, loading, error };
}

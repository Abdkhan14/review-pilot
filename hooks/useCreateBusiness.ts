"use client";
import { useState } from "react";
import { api } from "./api";

type CreateInput = {
  name: string;
  placeId: string;
  tier: "BASIC" | "SAAS";
  customInstructions?: string;
};

type CreateResult = { slug: string };

export function useCreateBusiness() {
  const [data, setData] = useState<CreateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createBusiness(input: CreateInput): Promise<CreateResult | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<CreateResult>("/api/admin/businesses", input);
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

  return { createBusiness, data, loading, error };
}

"use client";
import { useState } from "react";
import { api } from "./api";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(password: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/auth/login", { password });
      return true;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const message = axiosErr?.response?.data?.error ?? "Something went wrong";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}

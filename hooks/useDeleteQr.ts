"use client";
import { useState } from "react";
import { api } from "./api";

export function useDeleteQr(id: string) {
  const [loading, setLoading] = useState(false);

  async function deleteQr(): Promise<boolean> {
    setLoading(true);
    try {
      await api.delete(`/api/app/qr/${id}`);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { deleteQr, loading };
}

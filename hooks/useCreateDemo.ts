"use client";

import { useState } from "react";
import { api } from "@/hooks/api";

export type DemoResult = {
  id: string;
  name: string;
  assistedUrl: string;
  basicUrl: string;
  assistedQrSvg: string;
  basicQrSvg: string;
  triesLeft: number;
  expiresAt: string;
};

export type DemoErrorCode =
  | "rate_limited"
  | "blocked"
  | "visitor_limit"
  | "busy"
  | "place_failed"
  | "used_up"
  | "network";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "result"; data: DemoResult }
  | { status: "error"; code: DemoErrorCode };

export function useCreateDemo() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function create(placeId: string, notes: string, sessionToken: string) {
    setState({ status: "loading" });
    try {
      const res = await api.post<DemoResult>("/api/demo", {
        placeId,
        notes: notes.trim(),
        sessionToken,
      });
      setState({ status: "result", data: res.data });
    } catch (err: unknown) {
      const body = (err as { response?: { data?: { error?: string } } })?.response?.data;
      const code = (body?.error as DemoErrorCode | undefined) ?? "network";
      setState({ status: "error", code });
    }
  }

  function reset() {
    setState({ status: "idle" });
  }

  return { state, create, reset };
}

"use client";

import { useState, useEffect } from "react";
import { api } from "@/hooks/api";

export type PlaceSuggestion = {
  placeId: string;
  name: string;
  address: string;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "results"; places: PlaceSuggestion[] }
  | { status: "error" };

type Settled = Extract<State, { status: "results" | "error" }>;

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

export function usePlaceSearch() {
  const [query, setQuery] = useState("");
  const [settled, setSettled] = useState<{ query: string; state: Settled } | null>(null);
  // One token per search lifecycle so Google bills autocomplete + details as one session.
  const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID());

  const state: State =
    query.length < MIN_QUERY_LENGTH
      ? { status: "idle" }
      : settled?.query === query
        ? settled.state
        : { status: "loading" };

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.post<{ places: PlaceSuggestion[] }>(
          "/api/places/autocomplete",
          { input: query, sessionToken },
        );
        if (!cancelled) setSettled({ query, state: { status: "results", places: res.data.places } });
      } catch {
        if (!cancelled) setSettled({ query, state: { status: "error" } });
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, sessionToken]);

  function reset() {
    setQuery("");
    setSettled(null);
    setSessionToken(crypto.randomUUID());
  }

  return { query, setQuery, state, sessionToken, reset };
}

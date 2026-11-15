"use client";

import { useState, useEffect, useRef } from "react";
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

const DEBOUNCE_MS = 250;

export function usePlaceSearch() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  // One session token per search lifecycle, reset after a place is picked.
  const sessionTokenRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    if (query.length < 2) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });
    const timer = setTimeout(async () => {
      try {
        const res = await api.post<{ places: PlaceSuggestion[] }>(
          "/api/places/autocomplete",
          { input: query, sessionToken: sessionTokenRef.current },
        );
        setState({ status: "results", places: res.data.places });
      } catch {
        setState({ status: "error" });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  function resetSessionToken() {
    sessionTokenRef.current = crypto.randomUUID();
  }

  return { query, setQuery, state, sessionToken: sessionTokenRef.current, resetSessionToken };
}

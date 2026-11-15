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

const DEBOUNCE_MS = 400;

export function usePlaceSearch() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  // Session token is tracked as state so DemoWidget re-renders when it changes.
  const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID());
  // When select() is called we set the query to the place name, but we don't
  // want that to trigger another search. This flag skips the next effect run.
  const skipNextRef = useRef(false);

  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }

    if (query.length < 2) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.post<{ places: PlaceSuggestion[] }>(
          "/api/places/autocomplete",
          { input: query, sessionToken },
        );
        if (!cancelled) setState({ status: "results", places: res.data.places });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, sessionToken]);

  function select(place: PlaceSuggestion) {
    skipNextRef.current = true;
    setQuery(place.name);
    setState({ status: "idle" });
  }

  function reset() {
    setQuery("");
    setState({ status: "idle" });
    setSessionToken(crypto.randomUUID());
  }

  return { query, setQuery, state, sessionToken, select, reset };
}

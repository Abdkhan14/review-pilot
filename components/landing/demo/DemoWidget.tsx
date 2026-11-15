"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePlaceSearch, type PlaceSuggestion } from "@/hooks/usePlaceSearch";
import { useCreateDemo } from "@/hooks/useCreateDemo";
import { PlaceSearch } from "./PlaceSearch";
import { DemoResult } from "./DemoResult";
import { DemoError } from "./DemoError";

export function DemoWidget() {
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [notes, setNotes] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { query, setQuery, state: searchState, sessionToken, resetSessionToken } = usePlaceSearch();
  const { state: demoState, create, reset } = useCreateDemo();

  function handleSelect(place: PlaceSuggestion) {
    setSelectedPlace(place);
    setQuery(place.name);
    setDropdownOpen(false);
    resetSessionToken();
  }

  function handleQueryChange(q: string) {
    setQuery(q);
    setSelectedPlace(null);
    setDropdownOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlace) return;
    await create(selectedPlace.placeId, notes, sessionToken);
  }

  function handleMakeAnother() {
    reset();
    setSelectedPlace(null);
    setQuery("");
    setNotes("");
    setDropdownOpen(false);
  }

  if (demoState.status === "result") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col gap-4">
        <p className="text-sm font-semibold text-zinc-900">{demoState.data.name}</p>
        <DemoResult result={demoState.data} onMakeAnother={handleMakeAnother} />
      </div>
    );
  }

  if (demoState.status === "error") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col gap-4">
        <DemoError code={demoState.code} onTryAgain={handleMakeAnother} />
      </div>
    );
  }

  const suggestions =
    searchState.status === "results" ? searchState.places : [];

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col gap-4"
    >
      <PlaceSearch
        query={query}
        onQueryChange={handleQueryChange}
        suggestions={suggestions}
        showDropdown={(dropdownOpen || searchState.status === "results") && query.length >= 2}
        onSelect={handleSelect}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-zinc-900" htmlFor="demo-notes">
          What makes you special?{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <Textarea
          id="demo-notes"
          placeholder="Thin-crust pizza, great service, cosy patio…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedPlace || demoState.status === "loading"}
      >
        {demoState.status === "loading" ? "Creating demo…" : "Generate demo link"}
      </Button>
    </form>
  );
}

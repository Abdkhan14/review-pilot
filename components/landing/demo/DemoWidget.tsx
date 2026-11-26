"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePlaceSearch, type PlaceSuggestion } from "@/hooks/usePlaceSearch";
import { useCreateDemo } from "@/hooks/useCreateDemo";
import { PlaceSearch } from "./PlaceSearch";
import { DemoResult } from "./DemoResult";
import { DemoQrPlaceholder } from "./DemoQrPlaceholder";
import { DemoError } from "./DemoError";

export function DemoWidget() {
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [notes, setNotes] = useState("");
  const search = usePlaceSearch();
  const { state: demoState, create, reset } = useCreateDemo();

  function handleSelect(place: PlaceSuggestion) {
    setSelectedPlace(place);
    search.setQuery("");
  }

  function handleClearPlace() {
    setSelectedPlace(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlace || !notes.trim()) return;
    await create(selectedPlace.placeId, notes, search.sessionToken);
  }

  function handleMakeAnother() {
    reset();
    setSelectedPlace(null);
    setNotes("");
    search.reset();
  }

  const suggestions =
    search.state.status === "results" ? search.state.places : [];

  const hasResult = demoState.status === "result";
  const isLoading = demoState.status === "loading";
  const canSubmit = !!selectedPlace && notes.trim().length > 0 && !isLoading;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left column: form (locked while result showing) or error */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col gap-4">
        {demoState.status === "error" ? (
          <DemoError code={demoState.code} onTryAgain={handleMakeAnother} />
        ) : (
          <fieldset disabled={hasResult} className="contents">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <PlaceSearch
                query={search.query}
                onQueryChange={search.setQuery}
                suggestions={suggestions}
                showDropdown={!selectedPlace && search.state.status === "results"}
                selected={selectedPlace}
                onSelect={handleSelect}
                onClear={handleClearPlace}
              />

              <div className="flex flex-col gap-1">
                <label
                  className="text-sm font-semibold text-zinc-900"
                  htmlFor="demo-notes"
                >
                  What makes you special?
                </label>
                <Textarea
                  id="demo-notes"
                  placeholder="Thin-crust pizza, great service, cosy patio…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {isLoading ? "Creating demo…" : "Generate demo link"}
              </Button>
            </form>
          </fieldset>
        )}
      </div>

      {/* Right column: result or placeholder */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col justify-center gap-4">
        {hasResult ? (
          <DemoResult
            result={demoState.data}
            onMakeAnother={handleMakeAnother}
          />
        ) : (
          <DemoQrPlaceholder loading={isLoading} />
        )}
      </div>
    </div>
  );
}

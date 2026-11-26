"use client";

import { MapPin, Search } from "lucide-react";
import { useRef } from "react";
import type { PlaceSuggestion } from "@/hooks/usePlaceSearch";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  invalid?: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  suggestions: PlaceSuggestion[];
  showDropdown: boolean;
  selected: PlaceSuggestion | null;
  onSelect: (place: PlaceSuggestion) => void;
  onClear: () => void;
};

export function PlaceSearch({
  label = "Your shop on Google",
  invalid = false,
  query,
  onQueryChange,
  suggestions,
  showDropdown,
  selected,
  onSelect,
  onClear,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClear() {
    onClear();
    // The input only mounts after the selected box unmounts.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="relative w-full">
      <label className="block text-sm font-semibold text-zinc-900 mb-1">
        {label}
      </label>

      {selected ? (
        <div className="flex items-center gap-2.5 min-h-11 border border-zinc-900 rounded-md px-3 py-1.5 bg-white">
          <MapPin className="size-4 text-zinc-900 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">{selected.name}</p>
            <p className="text-xs text-zinc-500 truncate">{selected.address}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            Change
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-2.5 h-11 border rounded-md px-3 bg-white focus-within:border-zinc-900",
            invalid ? "border-red-500" : "border-zinc-300",
          )}
        >
          <Search className="size-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            placeholder="Search for your business…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
            aria-label="Search for your business on Google"
            aria-autocomplete="list"
            aria-controls="place-search-listbox"
            aria-expanded={showDropdown}
            aria-invalid={invalid}
            role="combobox"
          />
        </div>
      )}

      {showDropdown && suggestions.length > 0 && (
        <ul
          id="place-search-listbox"
          role="listbox"
          className="absolute z-10 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-[0_12px_24px_-12px_rgba(24,24,27,0.2)] overflow-hidden py-1.5"
        >
          {suggestions.map((place) => (
            <li
              key={place.placeId}
              role="option"
              aria-selected="false"
              onMouseDown={() => onSelect(place)}
              className="cursor-pointer px-2.5 py-2.5 hover:bg-zinc-100 rounded-md mx-1.5"
            >
              <p className="text-sm font-semibold text-zinc-900 truncate">{place.name}</p>
              <p className="text-xs text-zinc-600 truncate">{place.address}</p>
            </li>
          ))}
          <li className="flex justify-end px-2.5 pt-1.5 pb-0.5">
            <span className="text-xs text-zinc-500">Results from Google</span>
          </li>
        </ul>
      )}
    </div>
  );
}

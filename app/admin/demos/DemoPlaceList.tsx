"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateDemoPlace } from "@/hooks/useUpdateDemoPlace";

export type DemoPlaceRow = {
  placeId: string;
  name: string;
  generationsUsed: number;
  generationLimit: number;
  blocked: boolean;
  todayCount: number;
  sessionCount: number;
};

type RowProps = { place: DemoPlaceRow; defaultLimit: number };

function PlaceRow({ place, defaultLimit }: RowProps) {
  const router = useRouter();
  const { update, loading } = useUpdateDemoPlace(place.placeId);
  const [showRaiseLimit, setShowRaiseLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(String(place.generationLimit));

  const isUsedUp = place.generationsUsed >= place.generationLimit && !place.blocked;
  const hasCustomLimit = place.generationLimit !== defaultLimit;

  async function act(action: Parameters<typeof update>[0]) {
    const ok = await update(action);
    if (ok) router.refresh();
  }

  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-2.5 ${
        place.blocked
          ? "bg-red-50 border-red-200"
          : "bg-white border-zinc-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-zinc-900">{place.name}</p>
        {place.blocked ? (
          <span className="text-xs font-semibold text-red-700 border border-red-200 px-2 py-0.5">
            Blocked
          </span>
        ) : isUsedUp ? (
          <span className="text-xs font-semibold text-zinc-700 border border-zinc-400 px-2 py-0.5">
            Used up
          </span>
        ) : hasCustomLimit ? (
          <span className="text-xs font-semibold text-blue-700 border border-blue-600 px-2 py-0.5">
            Custom limit
          </span>
        ) : (
          <span className="text-xs text-zinc-600">
            {place.generationLimit - place.generationsUsed} left
          </span>
        )}
      </div>

      <p className={`text-[13px] ${place.blocked ? "text-red-900" : "text-zinc-600"}`}>
        {place.generationsUsed} / {place.generationLimit} generations ·{" "}
        {place.sessionCount} {place.sessionCount === 1 ? "link" : "links"}
      </p>

      {showRaiseLimit && (
        <div className="rounded-md bg-zinc-50 p-3 flex flex-col gap-2">
          <p className="text-[13px] font-medium text-zinc-900">Limit for this shop</p>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min={place.generationsUsed + 1}
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              disabled={loading}
              onClick={async () => {
                const val = parseInt(limitInput, 10);
                if (!Number.isFinite(val) || val <= 0) return;
                const ok = await update({ action: "raiseLimit", limit: val });
                if (ok) { setShowRaiseLimit(false); router.refresh(); }
              }}
            >
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRaiseLimit(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {!place.blocked && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => act({ action: "reset" })}
            >
              Reset count
            </Button>
            {!showRaiseLimit && (
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => setShowRaiseLimit(true)}
              >
                Raise limit
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => act({ action: "block" })}
            >
              Block
            </Button>
          </>
        )}
        {place.blocked && (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => act({ action: "unblock" })}
          >
            Unblock
          </Button>
        )}
      </div>
    </div>
  );
}

type Props = {
  places: DemoPlaceRow[];
  defaultLimit: number;
};

export function DemoPlaceList({ places, defaultLimit }: Props) {
  if (places.length === 0) {
    return <p className="text-sm text-zinc-500">No demo shops yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {places.map((p) => (
        <PlaceRow key={p.placeId} place={p} defaultLimit={defaultLimit} />
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";

type Props = {
  /** Unix timestamp (ms) of the next UTC midnight. */
  retryAtMs: number;
};

function formatHms(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function DailyCap({ retryAtMs }: Props) {
  const [remaining, setRemaining] = useState(() => retryAtMs - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const left = retryAtMs - Date.now();
      setRemaining(left);
      if (left <= 0) clearInterval(id);
    }, 1_000);
    return () => clearInterval(id);
  }, [retryAtMs]);

  const expired = remaining <= 0;

  return (
    <div className="flex flex-col gap-4" data-testid="daily-cap">
      <Alert variant="destructive">
        According to Google&apos;s policies we should not be posting more than 5
        reviews a day, to avoid risking your account getting banned for review
        farming.
      </Alert>

      {expired ? (
        <div className="text-center">
          <p className="text-sm text-zinc-500 mb-3">You can try again now.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm underline text-zinc-700"
          >
            Reload
          </button>
        </div>
      ) : (
        <p className="text-center text-sm text-zinc-500" data-testid="daily-cap-timer">
          Available again in{" "}
          <span className="font-mono">{formatHms(remaining)}</span>
        </p>
      )}
    </div>
  );
}

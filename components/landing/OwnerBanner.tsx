"use client";

import { useState } from "react";

export function OwnerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="banner"
      className="flex items-center justify-between gap-4 bg-zinc-900 text-white px-6 py-3 text-sm"
    >
      <p>
        This is what your customers see.{" "}
        <a href="/sign-in" className="underline hover:text-zinc-300 transition-colors">
          Want to manage it? Sign in.
        </a>
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className="text-zinc-400 hover:text-white transition-colors shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

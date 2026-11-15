"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OwnerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="banner"
      className="flex items-center justify-between gap-4 bg-zinc-900 text-white px-6 py-3 text-sm"
    >
      <p>
        Own this business? This sticker is from our old system.{" "}
        <span className="text-zinc-400">Get your new QR here.</span>
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <Button asChild variant="outline" size="sm" className="bg-white text-zinc-900 hover:bg-zinc-100 border-white">
          <a href="/sign-in">Get my QR</a>
        </Button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

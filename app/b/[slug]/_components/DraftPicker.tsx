"use client";

import { useState } from "react";
import { DraftCard } from "./DraftCard";

type Draft = { id: string; text: string };

type Props = {
  drafts: Draft[];
  writeReviewUrl: string;
};

export function DraftPicker({ drafts, writeReviewUrl }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleDrafts = copiedId
    ? drafts.filter((d) => d.id === copiedId)
    : drafts;

  const showOr = !copiedId && drafts.length > 0;
  const linkLabel = copiedId ? "Go to Google Reviews" : "Skip to Google Reviews";

  return (
    <div className="flex flex-col gap-4">
      {visibleDrafts.map((draft) => (
        <DraftCard
          key={draft.id}
          text={draft.text}
          copied={copiedId === draft.id}
          onCopy={() => setCopiedId(draft.id)}
        />
      ))}

      {showOr && (
        <p className="py-4 text-center text-sm text-zinc-400">OR</p>
      )}

      <a
        href={writeReviewUrl}
        className="mt-2 block w-full border border-zinc-200 px-4 py-3 text-center text-sm font-medium hover:bg-zinc-50 transition-colors"
      >
        {linkLabel}
      </a>
    </div>
  );
}

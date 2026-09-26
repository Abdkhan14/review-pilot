"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DraftCard } from "./DraftCard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const;

const card = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
} as const;

type Draft = { id: string; text: string };

type Props = {
  drafts: Draft[];
  writeReviewUrl: string;
  slug: string;
  testing?: boolean;
  generateFailed?: boolean;
  rateLimited?: boolean;
};

export function DraftPicker({ drafts, writeReviewUrl, slug, testing = false, generateFailed = false, rateLimited = false }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleDrafts = copiedId
    ? drafts.filter((d) => d.id === copiedId)
    : drafts;

  const showOr = !copiedId && drafts.length > 0;
  const linkLabel = copiedId ? "Go to Google Reviews" : "Skip to Google Reviews";

  function handleGoogleClick() {
    if (copiedId && !testing) {
      navigator.sendBeacon(`/api/b/${encodeURIComponent(slug)}/handoff`);
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="draft-picker">
      {rateLimited && drafts.length === 0 && (
        <Alert variant="default">
          You&apos;ve generated a few times in a row — wait 30 seconds and try
          again, or skip straight to Google.
        </Alert>
      )}
      {generateFailed && drafts.length === 0 && (
        <Alert variant="default">
          Couldn&apos;t generate review drafts — you can still write your own or
          skip straight to Google.
        </Alert>
      )}

      <motion.div
        className="flex flex-col gap-4"
        variants={list}
        initial="hidden"
        animate="show"
      >
        {visibleDrafts.map((draft) => (
          <motion.div key={draft.id} variants={card}>
            <DraftCard
              text={draft.text}
              copied={copiedId === draft.id}
              onCopy={() => setCopiedId(draft.id)}
            />
          </motion.div>
        ))}
      </motion.div>

      {showOr && (
        <p className="text-center text-sm text-zinc-400">OR</p>
      )}

      <Button
        asChild
        variant="outline"
        className="w-full py-3"
      >
        <a href={writeReviewUrl} onClick={handleGoogleClick}>{linkLabel}</a>
      </Button>
    </div>
  );
}

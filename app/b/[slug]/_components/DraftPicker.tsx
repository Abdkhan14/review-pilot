"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DraftCard } from "./DraftCard";
import { Alert } from "@/components/ui/alert";

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
  generateFailed?: boolean;
};

export function DraftPicker({ drafts, writeReviewUrl, generateFailed = false }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleDrafts = copiedId
    ? drafts.filter((d) => d.id === copiedId)
    : drafts;

  const showOr = !copiedId && drafts.length > 0;
  const linkLabel = copiedId ? "Go to Google Reviews" : "Skip to Google Reviews";

  return (
    <div className="flex flex-col gap-4" data-testid="draft-picker">
      {generateFailed && drafts.length === 0 && (
        <Alert variant="default">
          Couldn't generate review drafts — you can still write your own or skip
          straight to Google.
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

      <a
        href={writeReviewUrl}
        className="block w-full border border-zinc-200 px-4 py-3 text-center text-sm font-medium hover:bg-zinc-50 transition-colors"
      >
        {linkLabel}
      </a>
    </div>
  );
}

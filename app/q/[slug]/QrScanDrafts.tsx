"use client";

import { useState } from "react";
import { ScanDrafts, anotherSetLabel } from "@/components/scan/ScanDrafts";

type Props = {
  slug: string;
  writeReviewUrl: string;
  testing: boolean;
  /** Trial generations left; null for plans that don't count generations. */
  initialTriesLeft: number | null;
};

export function QrScanDrafts({ slug, writeReviewUrl, testing, initialTriesLeft }: Props) {
  const [triesLeft, setTriesLeft] = useState(initialTriesLeft);
  const base = `/api/q/${encodeURIComponent(slug)}`;

  return (
    <ScanDrafts
      apiBase={`${base}/generate`}
      handoffUrl={`${base}/handoff`}
      writeReviewUrl={writeReviewUrl}
      testing={testing}
      onGenerated={({ triesLeft: left }) => {
        if (left !== undefined) setTriesLeft(left);
      }}
      anotherSetLabel={triesLeft === null ? undefined : anotherSetLabel(triesLeft)}
    />
  );
}

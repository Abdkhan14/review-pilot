"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/hooks/api";
import { GenerateProgress } from "./DraftsSkeleton";
import { DraftPicker } from "./DraftPicker";
import { stepIndexAt, progressPctAt, GENERATE_PROGRESS_MS } from "@/lib/generate-progress";

type Draft = { id: string; text: string };

type Props = {
  /** Full generate endpoint URL, e.g. /api/b/{slug}/generate */
  apiBase: string;
  /** Optional handoff endpoint URL forwarded to DraftPicker. */
  handoffUrl?: string;
  writeReviewUrl: string;
  testing?: boolean;
  /** Called after each successful generation with the response data. */
  onGenerated?: (data: { triesLeft?: number }) => void;
  /** When set, shows a "Try another set" button in the copied state.
   *  Pass an empty string to hide the button (0 tries left). */
  anotherSetLabel?: string;
};

type GenerateResponse = {
  reviews: Draft[];
  writeReviewUrl?: string | null;
  triesLeft?: number;
};

function fetchGeneration(url: string): Promise<GenerateResponse> {
  return api.post<GenerateResponse>(url).then((r) => r.data);
}

export function ScanDrafts({
  apiBase,
  handoffUrl,
  writeReviewUrl,
  testing = false,
  onGenerated,
  anotherSetLabel,
}: Props) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [url, setUrl] = useState(writeReviewUrl);
  const [loading, setLoading] = useState(true);
  const [generateFailed, setGenerateFailed] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [attempt, setAttempt] = useState(0);
  // Captured at generate start — the timer counts from when the user lands.
  const startRef = useRef<number>(Date.now());
  // One promise per (apiBase, attempt). React Strict Mode mounts effects twice
  // with the same deps; reusing the same promise means only one POST is sent.
  const inflightRef = useRef<{ key: string; promise: Promise<GenerateResponse> } | null>(null);

  // Tick every 100ms while loading; clears automatically when loading ends.
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 100);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    let cancelled = false;

    startRef.current = Date.now();
    setElapsedMs(0);
    setLoading(true);

    const generateUrl = testing ? `${apiBase}?testing=true` : apiBase;
    const key = `${generateUrl}:${attempt}`;

    if (inflightRef.current?.key !== key) {
      inflightRef.current = { key, promise: fetchGeneration(generateUrl) };
    }

    inflightRef.current.promise
      .then((data) => {
        if (cancelled) return;
        setDrafts(data.reviews);
        if (data.writeReviewUrl) setUrl(data.writeReviewUrl);
        setGenerateFailed(false);
        onGenerated?.({ triesLeft: data.triesLeft });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        const isRateLimited = status === 429;
        setRateLimited(isRateLimited);
        setGenerateFailed(!isRateLimited);
        setDrafts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBase, attempt, testing]);

  if (loading) {
    return (
      <GenerateProgress
        activeIndex={stepIndexAt(elapsedMs)}
        progressPct={progressPctAt(elapsedMs)}
        slow={elapsedMs >= GENERATE_PROGRESS_MS}
        onRegenerate={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <DraftPicker
      drafts={drafts}
      writeReviewUrl={url}
      handoffUrl={handoffUrl}
      testing={testing}
      generateFailed={generateFailed}
      rateLimited={rateLimited}
      anotherSetLabel={anotherSetLabel}
      onAnotherSet={() => setAttempt((n) => n + 1)}
    />
  );
}

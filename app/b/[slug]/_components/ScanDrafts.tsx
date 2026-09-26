"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/hooks/api";
import { GenerateProgress } from "./DraftsSkeleton";
import { DraftPicker } from "./DraftPicker";
import { stepIndexAt, progressPctAt, GENERATE_PROGRESS_MS } from "@/lib/generate-progress";

type Draft = { id: string; text: string };

type Props = {
  slug: string;
  writeReviewUrl: string;
};

type GenerateResponse = {
  reviews: Draft[];
  writeReviewUrl?: string | null;
};

export function ScanDrafts({ slug, writeReviewUrl }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [url, setUrl] = useState(writeReviewUrl);
  const [loading, setLoading] = useState(true);
  const [generateFailed, setGenerateFailed] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [attempt, setAttempt] = useState(0);
  // Captured at generate start — the timer counts from when the user lands.
  const startRef = useRef<number>(Date.now());

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

    // Reset the progress window at the start of each attempt.
    startRef.current = Date.now();
    setElapsedMs(0);
    setLoading(true);

    async function load() {
      try {
        const res = await api.post<GenerateResponse>(
          `/api/b/${encodeURIComponent(slug)}/generate`
        );
        if (cancelled) return;
        setDrafts(res.data.reviews);
        if (res.data.writeReviewUrl) setUrl(res.data.writeReviewUrl);
        setGenerateFailed(false);
      } catch (err: unknown) {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        const isRateLimited = status === 429;
        setRateLimited(isRateLimited);
        setGenerateFailed(!isRateLimited);
        setDrafts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

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
      generateFailed={generateFailed}
      rateLimited={rateLimited}
    />
  );
}

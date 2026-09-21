"use client";

import { useEffect, useState } from "react";
import { api } from "@/hooks/api";
import { DraftsSkeleton } from "./DraftsSkeleton";
import { DraftPicker } from "./DraftPicker";

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

  useEffect(() => {
    let cancelled = false;

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
        // Rate limit: skip link still works, no error banner.
        setGenerateFailed(status !== 429);
        setDrafts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <DraftsSkeleton />;

  return (
    <DraftPicker
      drafts={drafts}
      writeReviewUrl={url}
      generateFailed={generateFailed}
    />
  );
}

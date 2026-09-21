import { headers } from "next/headers";
import { buildPrompt } from "@/lib/prompt-builder";
import { generateDrafts } from "@/lib/generate-drafts";
import { ipFromHeaders, rateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import type { PlaceSnapshot } from "@/lib/place-snapshot";
import type { DraftReview } from "@/lib/generate-drafts";
import { DraftPicker } from "./DraftPicker";

type Props = {
  slug: string;
  snapshot: PlaceSnapshot;
  customInstructions?: string;
  writeReviewUrl: string;
};

export async function ScanDrafts({
  slug,
  snapshot,
  customInstructions,
  writeReviewUrl,
}: Props) {
  const ip = ipFromHeaders(await headers());
  const allowed = checkRateLimit(rateLimitKey(ip, slug));

  let drafts: DraftReview[] = [];
  let generateFailed = false;
  if (allowed) {
    const messages = buildPrompt({ snapshot, customInstructions });
    try {
      drafts = await generateDrafts(messages);
    } catch {
      generateFailed = true;
    }
  }

  return (
    <DraftPicker
      drafts={drafts}
      writeReviewUrl={writeReviewUrl}
      generateFailed={generateFailed}
    />
  );
}

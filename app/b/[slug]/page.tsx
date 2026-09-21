import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { buildPrompt } from "@/lib/prompt-builder";
import { generateDrafts } from "@/lib/generate-drafts";
import { buildWriteReviewUrl } from "@/lib/write-review-url";
import { ipFromHeaders, rateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import type { PlaceSnapshot } from "@/lib/place-snapshot";
import type { DraftReview } from "@/lib/generate-drafts";
import { DraftPicker } from "./_components/DraftPicker";
export default async function ScanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await findBySlug(db, slug);
  if (!business) notFound();

  if (business.tier === "BASIC") {
    if (!business.writeReviewUrl) notFound();
    redirect(business.writeReviewUrl);
  }

  // SAAS: call lib directly — server-only, no secrets reach the browser.
  const snapshot: PlaceSnapshot = business.details
    ? (JSON.parse(business.details) as PlaceSnapshot)
    : {
        placeId: business.placeId,
        name: business.name,
        address: "",
        writeReviewUrl: business.writeReviewUrl ?? "",
        fetchedAt: "",
      };

  const ip = ipFromHeaders(await headers());
  const allowed = checkRateLimit(rateLimitKey(ip, slug));

  let drafts: DraftReview[] = [];
  let generateFailed = false;
  if (allowed) {
    const messages = buildPrompt({
      snapshot,
      customInstructions: business.customInstructions ?? undefined,
    });
    try {
      drafts = await generateDrafts(messages);
    } catch {
      generateFailed = true;
    }
  }

  // Fallback so skip is always functional even if writeReviewUrl was never stored.
  const googleUrl =
    business.writeReviewUrl ?? buildWriteReviewUrl(business.placeId);

  return (
    <main>
      <h1 className="pb-6 text-lg font-semibold">
        Pick a review to share
      </h1>
      <DraftPicker
        drafts={drafts}
        writeReviewUrl={googleUrl}
        generateFailed={generateFailed}
      />
    </main>
  );
}

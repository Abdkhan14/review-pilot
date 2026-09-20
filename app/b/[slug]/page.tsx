import { notFound, redirect } from "next/navigation";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { buildPrompt } from "@/lib/prompt-builder";
import { generateDrafts } from "@/lib/generate-drafts";
import { buildWriteReviewUrl } from "@/lib/write-review-url";
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

  const messages = buildPrompt({
    snapshot,
    customInstructions: business.customInstructions ?? undefined,
  });

  let drafts: DraftReview[] = [];
  try {
    drafts = await generateDrafts(messages);
  } catch {
    // Generation failed — render empty; skip still works via DraftPicker.
  }

  // Fallback so skip is always functional even if writeReviewUrl was never stored.
  const googleUrl =
    business.writeReviewUrl ?? buildWriteReviewUrl(business.placeId);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4">
      <h1 className="pt-10 pb-6 text-lg font-semibold">
        Pick a review to share
      </h1>
      <DraftPicker drafts={drafts} writeReviewUrl={googleUrl} />
    </main>
  );
}

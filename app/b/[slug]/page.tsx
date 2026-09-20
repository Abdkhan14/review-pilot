import { notFound, redirect } from "next/navigation";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { buildPrompt } from "@/lib/prompt-builder";
import { generateDrafts } from "@/lib/generate-drafts";
import type { PlaceSnapshot } from "@/lib/place-snapshot";
import type { DraftReview } from "@/lib/generate-drafts";
import { DraftCard } from "./_components/DraftCard";
import { layoutClass } from "@/app/tokens";

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
    // Generation failed — render empty; full error copy comes in 9.1.
  }

  return (
    <main className={layoutClass.column}>
      <h1 className="pt-10 pb-6 text-lg font-semibold">
        How was your visit to {snapshot.name}?
      </h1>
      <div className="flex flex-col gap-4">
        {drafts.map((draft) => (
          <DraftCard key={draft.id} text={draft.text} />
        ))}
      </div>
    </main>
  );
}

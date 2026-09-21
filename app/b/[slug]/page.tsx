import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { buildWriteReviewUrl } from "@/lib/write-review-url";
import type { PlaceSnapshot } from "@/lib/place-snapshot";
import { DraftsSkeleton } from "./_components/DraftsSkeleton";
import { ScanDrafts } from "./_components/ScanDrafts";

/** Do not prerender — slug lookup, rate limit, and OpenAI drafts must run per scan. */
export const dynamic = "force-dynamic";

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

  const snapshot: PlaceSnapshot = business.details
    ? (JSON.parse(business.details) as PlaceSnapshot)
    : {
        placeId: business.placeId,
        name: business.name,
        address: "",
        writeReviewUrl: business.writeReviewUrl ?? "",
        fetchedAt: "",
      };

  const googleUrl =
    business.writeReviewUrl ?? buildWriteReviewUrl(business.placeId);

  return (
    <main>
      <h1 className="pb-6 text-lg font-semibold">
        Pick a review to share
      </h1>
      <Suspense fallback={<DraftsSkeleton />}>
        <ScanDrafts
          slug={slug}
          snapshot={snapshot}
          customInstructions={business.customInstructions ?? undefined}
          writeReviewUrl={googleUrl}
        />
      </Suspense>
    </main>
  );
}

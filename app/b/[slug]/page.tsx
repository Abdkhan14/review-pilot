import { notFound, redirect } from "next/navigation";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { buildWriteReviewUrl } from "@/lib/write-review-url";
import { todayCount, isDailyCapped, nextUtcMidnightMs } from "@/lib/handoff";
import { ScanDrafts } from "./_components/ScanDrafts";
import { DailyCap } from "./_components/DailyCap";

/** Do not prerender — slug lookup must run against Turso on each scan. */
export const dynamic = "force-dynamic";

export default async function ScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ testing?: string }>;
}) {
  const { slug } = await params;
  const { testing } = await searchParams;
  const isTesting = testing === "true";
  const business = await findBySlug(db, slug);
  if (!business) notFound();

  if (business.tier === "BASIC") {
    if (!business.writeReviewUrl) notFound();
    redirect(business.writeReviewUrl);
  }

  const googleUrl =
    business.writeReviewUrl ?? buildWriteReviewUrl(business.placeId);

  const handoffRow = await db.businessHandoff.findUnique({
    where: { businessId: business.id },
  });
  const now = new Date();
  const capped = !isTesting && isDailyCapped(todayCount(handoffRow, now));

  if (capped) {
    return (
      <main>
        <h1 className="pb-6 text-lg font-semibold">Reviews paused for today</h1>
        <DailyCap retryAtMs={nextUtcMidnightMs(now)} />
      </main>
    );
  }

  return (
    <main>
      <h1 className="pb-6 text-lg font-semibold">
        Pick a review to share
      </h1>
      <ScanDrafts slug={slug} writeReviewUrl={googleUrl} testing={isTesting} />
    </main>
  );
}

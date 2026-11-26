import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { findOwnedBySlug } from "@/lib/business-repo";
import { nextUtcMidnightMs, todayCount } from "@/lib/handoff";
import { canTestScan, effectivePlan, scanOutcome, trialRemaining } from "@/lib/plan";
import { getSessionUser } from "@/lib/session";
import { getLimits, handoffCap } from "@/lib/settings";
import { buildWriteReviewUrl } from "@/lib/write-review-url";
import { DailyCap } from "@/components/scan/DailyCap";
import { InactiveQr } from "./InactiveQr";
import { QrScanDrafts } from "./QrScanDrafts";

/** Do not prerender — every scan reads the QR's current plan and counts. */
export const dynamic = "force-dynamic";

export default async function QrScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ testing?: string }>;
}) {
  const [{ slug }, { testing }] = await Promise.all([params, searchParams]);
  const qr = await findOwnedBySlug(db, slug);
  if (!qr) notFound();

  // Only test scans read the session, so ordinary scans never touch it.
  const isTest = testing === "true" && canTestScan(await getSessionUser(await headers()), qr);
  const limits = await getLimits(db);
  const plan = effectivePlan(qr, limits);
  const now = new Date();
  const cap = handoffCap(qr, limits);
  const outcome = isTest ? "drafts" : scanOutcome(plan, todayCount(qr.handoff, now), cap);
  const writeReviewUrl = qr.writeReviewUrl ?? buildWriteReviewUrl(qr.placeId);

  if (outcome === "google") redirect(writeReviewUrl);
  if (outcome === "inactive") return <InactiveQr shopName={qr.name} />;
  if (outcome === "daily_cap" && cap !== null) {
    return (
      <main>
        <h1 className="pb-6 text-lg font-semibold">Reviews paused for today</h1>
        <DailyCap retryAtMs={nextUtcMidnightMs(now)} limit={cap} />
      </main>
    );
  }

  const countsTrial = plan === "trial" && !isTest;
  return (
    <main>
      {isTest && (
        <p className="-mx-4 -mt-10 mb-8 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Test scan. Nothing is counted and limits are skipped. Only you see this.
        </p>
      )}
      <h1 className="pb-6 text-lg font-semibold">Pick a review to share</h1>
      <QrScanDrafts
        slug={slug}
        writeReviewUrl={writeReviewUrl}
        testing={isTest}
        initialTriesLeft={countsTrial ? trialRemaining(qr, limits).generations : null}
      />
    </main>
  );
}

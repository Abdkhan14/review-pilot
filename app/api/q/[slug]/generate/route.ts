import "server-only";
import { NextRequest, NextResponse } from "next/server";
import type { Business } from "@prisma/client";
import { db } from "@/lib/db";
import { findOwnedBySlug } from "@/lib/business-repo";
import { GenerationError } from "@/lib/generate-drafts";
import { nextUtcMidnightMs, todayCount } from "@/lib/handoff";
import { snapshotFromBusiness } from "@/lib/place-snapshot";
import { canTestScan, effectivePlan, scanOutcome, trialRemaining } from "@/lib/plan";
import { checkRateLimit, ipFromHeaders, rateLimitKey } from "@/lib/rate-limit";
import { writeReviewDrafts } from "@/lib/review-drafts";
import { getSessionUser } from "@/lib/session";
import { getLimits, handoffCap, type AppLimits } from "@/lib/settings";
import { reserveTrialGeneration, releaseTrialGeneration } from "@/lib/usage";
import { buildWriteReviewUrl } from "@/lib/write-review-url";

type OwnedQr = NonNullable<Awaited<ReturnType<typeof findOwnedBySlug>>>;

/** Whether this scan may get drafts, and if so whether it uses up a trial generation. */
async function admit(req: NextRequest, qr: OwnedQr, limits: AppLimits) {
  const wantsTest = req.nextUrl.searchParams.get("testing") === "true";
  if (wantsTest && canTestScan(await getSessionUser(req.headers), qr)) {
    return { countsTrial: false };
  }

  const now = new Date();
  const plan = effectivePlan(qr, limits);
  const outcome = scanOutcome(plan, todayCount(qr.handoff, now), handoffCap(qr, limits));
  if (outcome === "daily_cap") {
    return NextResponse.json({ error: "daily_cap", retryAt: nextUtcMidnightMs(now) }, { status: 409 });
  }
  if (outcome !== "drafts") return new NextResponse(null, { status: 403 });
  return { countsTrial: plan === "trial" };
}

async function writeDrafts(qr: Business) {
  const reviews = await writeReviewDrafts(snapshotFromBusiness(qr), qr.customInstructions ?? undefined);
  return { reviews, writeReviewUrl: qr.writeReviewUrl ?? buildWriteReviewUrl(qr.placeId) };
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const qr = await findOwnedBySlug(db, slug);
  if (!qr) return new NextResponse(null, { status: 404 });

  if (!checkRateLimit(rateLimitKey(ipFromHeaders(req.headers), `q:${slug}`))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const limits = await getLimits(db);
  const admission = await admit(req, qr, limits);
  if (admission instanceof NextResponse) return admission;

  // Two scans can both pass the plan check; the reservation is what enforces the limit.
  const reserved =
    admission.countsTrial &&
    (await reserveTrialGeneration(db, qr.id, limits["trial.generationLimit"]));
  if (admission.countsTrial && !reserved) return new NextResponse(null, { status: 403 });

  try {
    const drafts = await writeDrafts(qr);
    if (!reserved) return NextResponse.json(drafts);
    const left = trialRemaining({ ...qr, trialGenerations: qr.trialGenerations + 1 }, limits);
    return NextResponse.json({ ...drafts, triesLeft: left.generations });
  } catch (err) {
    if (reserved) await releaseTrialGeneration(db, qr.id);
    if (err instanceof GenerationError) {
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }
    throw err;
  }
}

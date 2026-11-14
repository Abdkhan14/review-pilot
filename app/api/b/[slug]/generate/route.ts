import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { ipFromHeaders, rateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { todayCount, isDailyCapped, nextUtcMidnightMs } from "@/lib/handoff";
import { snapshotFromBusiness } from "@/lib/place-snapshot";
import { writeReviewDrafts } from "@/lib/review-drafts";
import { GenerationError } from "@/lib/generate-drafts";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const business = await findBySlug(db, slug);
  if (!business) return new NextResponse(null, { status: 404 });
  if (business.tier === "BASIC") return new NextResponse(null, { status: 403 });

  const ip = ipFromHeaders(_req.headers);
  if (!checkRateLimit(rateLimitKey(ip, slug))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const isTesting = _req.nextUrl.searchParams.get("testing") === "true";

  if (!isTesting) {
    const handoffRow = await db.businessHandoff.findUnique({
      where: { businessId: business.id },
    });
    const now = new Date();
    if (isDailyCapped(todayCount(handoffRow, now))) {
      return NextResponse.json(
        { error: "daily_cap", retryAt: nextUtcMidnightMs(now) },
        { status: 409 },
      );
    }
  }

  const snapshot = snapshotFromBusiness(business);

  try {
    const reviews = await writeReviewDrafts(snapshot, business.customInstructions ?? undefined);
    return NextResponse.json({ reviews, writeReviewUrl: business.writeReviewUrl });
  } catch (err) {
    if (err instanceof GenerationError) {
      return NextResponse.json({ error: "generation failed" }, { status: 500 });
    }
    throw err;
  }
}

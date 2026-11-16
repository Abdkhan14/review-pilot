import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { isNewLandingEnabled } from "@/lib/flags";
import { ipFromHeaders, rateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { getLimits } from "@/lib/settings";
import { isExpired, placeLimit, triesLeft } from "@/lib/demo";
import { findSession } from "@/lib/demo-repo";
import { reserveGeneration, releaseGeneration, siteGenerationsToday } from "@/lib/usage";
import { snapshotFromBusiness } from "@/lib/place-snapshot";
import { writeReviewDrafts } from "@/lib/review-drafts";
import { GenerationError } from "@/lib/generate-drafts";
import { buildWriteReviewUrl } from "@/lib/write-review-url";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  if (!(await isNewLandingEnabled(req.cookies))) {
    return new NextResponse(null, { status: 404 });
  }

  const session = await findSession(db, id);
  if (!session) {
    return new NextResponse(null, { status: 404 });
  }

  const now = new Date();

  if (isExpired(session, now)) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  if (session.place.blocked) {
    return NextResponse.json({ error: "blocked" }, { status: 410 });
  }

  const ip = ipFromHeaders(req.headers);
  if (!checkRateLimit(rateLimitKey(ip, `d:${id}`))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const limits = await getLimits(db);
  const siteCount = await siteGenerationsToday(db, now);
  if (siteCount >= limits["demo.dailyGenerations"]) {
    return NextResponse.json({ error: "busy" }, { status: 503 });
  }

  const limit = placeLimit(session.place, limits);
  const reserved = await reserveGeneration(db, session.id, session.placeId, limit);
  if (!reserved) {
    return NextResponse.json({ error: "used_up" }, { status: 409 });
  }

  const snapshot = snapshotFromBusiness({
    details: session.place.details,
    placeId: session.place.placeId,
    name: session.place.name,
    writeReviewUrl: session.place.writeReviewUrl,
  });

  try {
    const reviews = await writeReviewDrafts(
      snapshot,
      session.customInstructions ?? undefined,
    );

    const freshPlace = await db.demoPlace.findUnique({
      where: { placeId: session.placeId },
    });

    return NextResponse.json({
      reviews,
      writeReviewUrl:
        session.place.writeReviewUrl ?? buildWriteReviewUrl(session.place.placeId),
      triesLeft: freshPlace ? triesLeft(freshPlace, limits) : 0,
    });
  } catch (err) {
    await releaseGeneration(db, session.id, session.placeId);
    if (err instanceof GenerationError) {
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }
    throw err;
  }
}

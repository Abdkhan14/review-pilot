import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isNewLandingEnabled } from "@/lib/flags";
import { ipFromHeaders, rateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { getLimits } from "@/lib/settings";
import { hashIp, triesLeft } from "@/lib/demo";
import {
  findOrCreatePlace,
  createSession,
  pruneSessions,
} from "@/lib/demo-repo";
import {
  visitorSessionsToday,
  siteGenerationsToday,
} from "@/lib/usage";
import { fetchPlaceDetails } from "@/lib/places-details";
import { encodeQrSvg } from "@/lib/encode-qr";
import { buildDemoUrl } from "@/lib/scan-url";

const bodySchema = z.object({
  placeId: z.string().min(1),
  notes: z.string().trim().min(1).max(500),
  sessionToken: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await isNewLandingEnabled(req.headers))) {
    return new NextResponse(null, { status: 404 });
  }

  const ip = ipFromHeaders(req.headers);
  if (!checkRateLimit(rateLimitKey(ip, "demo"))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { placeId, notes, sessionToken } = parsed.data;
  const now = new Date();
  const limits = await getLimits(db);
  const ipHash = await hashIp(ip);

  // Check if the shop is known and blocked before hitting Google.
  const knownPlace = await db.demoPlace.findUnique({ where: { placeId } });
  if (knownPlace?.blocked) {
    return NextResponse.json({ error: "blocked" }, { status: 403 });
  }

  const visitorCount = await visitorSessionsToday(db, ipHash, now);
  if (visitorCount >= limits["demo.createsPerIpPerDay"]) {
    return NextResponse.json({ error: "visitor_limit" }, { status: 429 });
  }

  const siteCount = await siteGenerationsToday(db, now);
  if (siteCount >= limits["demo.dailyGenerations"]) {
    return NextResponse.json({ error: "busy" }, { status: 503 });
  }

  let place;
  try {
    place = await findOrCreatePlace(db, placeId, (id) =>
      fetchPlaceDetails(id, sessionToken),
    );
  } catch {
    return NextResponse.json({ error: "place_failed" }, { status: 502 });
  }

  // Re-check blocked in case the place was just created but somehow blocked
  // (edge case: admin blocks between the check above and creation).
  if (place.blocked) {
    return NextResponse.json({ error: "blocked" }, { status: 403 });
  }

  if (triesLeft(place, limits) === 0) {
    return NextResponse.json({ error: "used_up" }, { status: 409 });
  }

  await pruneSessions(db, now);
  const session = await createSession(db, placeId, ipHash, notes, now);

  const origin = process.env.APP_URL || req.nextUrl.origin;
  const assistedUrl = buildDemoUrl(origin, session.id);
  const basicUrl = `${assistedUrl}?plan=basic`;

  const [assistedQrSvg, basicQrSvg] = await Promise.all([
    encodeQrSvg(assistedUrl),
    encodeQrSvg(basicUrl),
  ]);

  return NextResponse.json({
    id: session.id,
    name: place.name,
    assistedUrl,
    basicUrl,
    assistedQrSvg,
    basicQrSvg,
    triesLeft: triesLeft(place, limits),
    expiresAt: session.expiresAt.toISOString(),
  });
}

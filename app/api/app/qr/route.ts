import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createTrialQr, listOwned } from "@/lib/business-repo";
import { fetchPlaceDetails } from "@/lib/places-details";
import { effectivePlan } from "@/lib/plan";
import { requireUser } from "@/lib/require-user";
import { getLimits } from "@/lib/settings";

const createSchema = z.object({
  placeId: z.string().min(1),
  notes: z.string().trim().max(4000).optional(),
  plan: z.enum(["trial", "basic", "assisted"]),
  sessionToken: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const [rows, limits] = await Promise.all([listOwned(db, user.id), getLimits(db)]);
  return NextResponse.json({
    qrs: rows.map((qr) => ({
      id: qr.id,
      slug: qr.slug,
      name: qr.name,
      plan: effectivePlan(qr, limits),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { placeId, notes, plan, sessionToken } = parsed.data;

  if (plan !== "trial") {
    return NextResponse.json({ error: "payment_required" }, { status: 402 });
  }

  let snapshot;
  try {
    snapshot = await fetchPlaceDetails(placeId, sessionToken);
  } catch {
    return NextResponse.json({ error: "place_failed" }, { status: 502 });
  }

  const qr = await createTrialQr(db, {
    ownerId: user.id,
    name: snapshot.name,
    placeId,
    customInstructions: notes || undefined,
    writeReviewUrl: snapshot.writeReviewUrl,
    details: JSON.stringify(snapshot),
    detailsFetchedAt: new Date(),
  });
  if (!qr) {
    return NextResponse.json({ error: "trial_used" }, { status: 409 });
  }

  return NextResponse.json({ id: qr.id, slug: qr.slug }, { status: 201 });
}

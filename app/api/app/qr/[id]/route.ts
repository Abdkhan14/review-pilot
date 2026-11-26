import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { remove, updateQr, type UpdateQrInput } from "@/lib/business-repo";
import { fetchPlaceDetails } from "@/lib/places-details";
import { effectivePlan } from "@/lib/plan";
import { requireOwnedQr } from "@/lib/require-user";
import { getLimits } from "@/lib/settings";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z
  .object({
    customInstructions: z.string().max(4000).nullable().optional(),
    refreshPlace: z.literal(true).optional(),
  })
  .refine((body) => body.customInstructions !== undefined || body.refreshPlace, {
    message: "nothing to update",
  });

export async function GET(req: NextRequest, ctx: Ctx) {
  const qr = await requireOwnedQr(req, (await ctx.params).id);
  if (qr instanceof NextResponse) return qr;

  return NextResponse.json({
    id: qr.id,
    slug: qr.slug,
    name: qr.name,
    plan: effectivePlan(qr, await getLimits(db)),
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const qr = await requireOwnedQr(req, (await ctx.params).id);
  if (qr instanceof NextResponse) return qr;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { customInstructions, refreshPlace } = parsed.data;

  const input: UpdateQrInput = {};
  if (customInstructions !== undefined) {
    input.customInstructions = customInstructions?.trim() || null;
  }
  if (refreshPlace) {
    try {
      const snapshot = await fetchPlaceDetails(qr.placeId);
      input.details = JSON.stringify(snapshot);
      input.writeReviewUrl = snapshot.writeReviewUrl;
      input.detailsFetchedAt = new Date();
    } catch {
      return NextResponse.json({ error: "place_failed" }, { status: 502 });
    }
  }

  const updated = await updateQr(db, qr.id, input);
  return NextResponse.json({
    customInstructions: updated.customInstructions,
    detailsFetchedAt: updated.detailsFetchedAt,
  });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const qr = await requireOwnedQr(req, (await ctx.params).id);
  if (qr instanceof NextResponse) return qr;

  await remove(db, qr.id);
  return new NextResponse(null, { status: 204 });
}

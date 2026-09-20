import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { buildPrompt } from "@/lib/prompt-builder";
import { generateDrafts, GenerationError } from "@/lib/generate-drafts";
import type { PlaceSnapshot } from "@/lib/place-snapshot";

function snapshotFromBusiness(business: {
  details: string | null;
  placeId: string;
  name: string;
  writeReviewUrl: string | null;
}): PlaceSnapshot {
  if (business.details) {
    return JSON.parse(business.details) as PlaceSnapshot;
  }
  // Minimal fallback when no details snapshot has been stored yet.
  return {
    placeId: business.placeId,
    name: business.name,
    address: "",
    writeReviewUrl: business.writeReviewUrl ?? "",
    fetchedAt: new Date().toISOString(),
  };
}

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const business = await findBySlug(db, slug);
  if (!business) return new NextResponse(null, { status: 404 });
  if (business.tier === "BASIC") return new NextResponse(null, { status: 403 });

  const snapshot = snapshotFromBusiness(business);

  const messages = buildPrompt({
    snapshot,
    customInstructions: business.customInstructions ?? undefined,
  });

  try {
    const reviews = await generateDrafts(messages);
    return NextResponse.json({
      reviews,
      writeReviewUrl: business.writeReviewUrl,
    });
  } catch (err) {
    if (err instanceof GenerationError) {
      return NextResponse.json({ error: "generation failed" }, { status: 500 });
    }
    throw err;
  }
}

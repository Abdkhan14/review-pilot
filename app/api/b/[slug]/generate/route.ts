import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { buildPrompt, anglesForPrimaryType } from "@/lib/prompt-builder";
import { generateDrafts, GenerationError } from "@/lib/generate-drafts";
import { ipFromHeaders, rateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { parseCatalog, sampleItems, DRAFT_COUNT } from "@/lib/catalog-items";
import { sampleRecipeTrio } from "@/lib/review-recipe";
import { applyTexture, applyTypo } from "@/lib/review-texture";
import type { PlaceSnapshot } from "@/lib/place-snapshot";

const DRAFT_IDS = ["a", "b", "c"] as const;
type DraftId = (typeof DRAFT_IDS)[number];

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

  const ip = ipFromHeaders(_req.headers);
  if (!checkRateLimit(rateLimitKey(ip, slug))) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const snapshot = snapshotFromBusiness(business);
  const rawNotes = business.customInstructions ?? undefined;

  // Parse the catalog once. Send only prose to the model — not the full item
  // list — to keep each prompt short and prevent gravitating to salient entries.
  let promptNotes: string | undefined = rawNotes;
  let itemNames: string[] = [];

  if (rawNotes) {
    const catalog = parseCatalog(rawNotes);
    const names = sampleItems(catalog, DRAFT_COUNT);
    if (names.length > 0) {
      itemNames = names;
      promptNotes = catalog.prose || undefined;
    }
  }

  const angles = anglesForPrimaryType(snapshot.primaryType);
  const recipes = sampleRecipeTrio();

  const messagesList = DRAFT_IDS.map((id, i) => {
    const recipe = recipes[i];
    const assignedItem =
      itemNames[i] && recipe.item !== "skip" ? itemNames[i] : undefined;
    return buildPrompt({
      id: id as DraftId,
      snapshot,
      angle: angles[i],
      recipe,
      assignedItem,
      customInstructions: promptNotes,
    });
  });

  try {
    const drafts = await generateDrafts(messagesList);

    // Apply light texture post-pass to at most one draft (enforced by sampleRecipeTrio).
    // Then apply a rare one-word typo swap (also at most one draft, never the
    // same draft as the texture slip).
    const reviews = drafts.map((draft, i) => {
      const recipe = recipes[i];
      const assignedItem = itemNames[i];
      const protectedStrings = [snapshot.name, ...(assignedItem ? [assignedItem] : [])];

      let text = draft.text;
      if (recipe.texture !== "clean") text = applyTexture(text, recipe.texture);
      if (recipe.typo !== "clean") text = applyTypo(text, recipe.typo, protectedStrings);
      return text !== draft.text ? { ...draft, text } : draft;
    });

    return NextResponse.json({ reviews, writeReviewUrl: business.writeReviewUrl });
  } catch (err) {
    if (err instanceof GenerationError) {
      return NextResponse.json({ error: "generation failed" }, { status: 500 });
    }
    throw err;
  }
}

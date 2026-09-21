import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { buildPrompt } from "@/lib/prompt-builder";
import { generateDrafts, GenerationError } from "@/lib/generate-drafts";
import { ipFromHeaders, rateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { parseCatalog, sampleItems, DRAFT_COUNT } from "@/lib/catalog-items";
import type { PlaceSnapshot } from "@/lib/place-snapshot";
import type { AssignedItem } from "@/lib/prompt-builder";

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

  // Parse the catalog once. When items are assignable we send only the prose
  // to the model — not the full item list — to keep the prompt short and
  // prevent the model from gravitating to salient catalog entries.
  let promptNotes: string | undefined = rawNotes;
  let assignedItems: AssignedItem[] | undefined;

  if (rawNotes) {
    const catalog = parseCatalog(rawNotes);
    const names = sampleItems(catalog, DRAFT_COUNT);
    if (names.length > 0) {
      assignedItems = names.map((name, i) => ({
        id: String.fromCharCode(97 + i) as AssignedItem["id"],
        name,
      }));
      // Only pass prose override guidance; the full item list is not needed.
      promptNotes = catalog.prose || undefined;
    }
  }

  const messages = buildPrompt({
    snapshot,
    customInstructions: promptNotes,
    assignedItems,
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

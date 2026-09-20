import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { create, list } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { parseCreateBusinessInput } from "@/lib/create-business-input";
import { requireAdmin } from "@/lib/require-admin";
import { fetchPlaceDetails } from "@/lib/places-details";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const rows = await list(db);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  // Parse — body validated by pure lib function; slug never accepted from client
  const body = await req.json().catch(() => null);
  const parsed = parseCreateBusinessInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Fetch Place Details (New) — one call per create, never per scan.
  // 502 on failure so the admin sees the error rather than persisting a broken row.
  let snapshot;
  try {
    snapshot = await fetchPlaceDetails(parsed.input.placeId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Places API unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Persist the admin-typed name but store Google's full snapshot in details.
  const business = await create(db, {
    ...parsed.input,
    writeReviewUrl: snapshot.writeReviewUrl,
    details: JSON.stringify(snapshot),
    detailsFetchedAt: new Date(),
  });

  // Return server-generated slug
  return NextResponse.json({ slug: business.slug }, { status: 201 });
}

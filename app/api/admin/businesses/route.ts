import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { create, list } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { parseCreateBusinessInput } from "@/lib/create-business-input";
import { requireAdmin } from "@/lib/require-admin";

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

  // Persist via existing repo
  const business = await create(db, parsed.input);

  // Return server-generated slug
  return NextResponse.json({ slug: business.slug }, { status: 201 });
}

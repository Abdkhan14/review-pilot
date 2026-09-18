import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { create, list } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { parseCreateBusinessInput } from "@/lib/create-business-input";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

/** Returns a 401 response if the request has no valid admin cookie, otherwise null. */
async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const session = token
    ? await verifySession(token).catch(() => null)
    : null;
  return session ? null : new NextResponse(null, { status: 401 });
}

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

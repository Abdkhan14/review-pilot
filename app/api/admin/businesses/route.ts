import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { create } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { parseCreateBusinessInput } from "@/lib/create-business-input";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

export async function POST(req: NextRequest) {
  // 1. Auth — read cookie from request (same pattern as proxy.ts)
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const session = token
    ? await verifySession(token).catch(() => null)
    : null;
  if (!session) return new NextResponse(null, { status: 401 });

  // 2. Parse — body validated by pure lib function; slug never accepted from client
  const body = await req.json().catch(() => null);
  const parsed = parseCreateBusinessInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // 3. Persist via existing repo
  const business = await create(db, parsed.input);

  // 4. Return server-generated slug
  return NextResponse.json({ slug: business.slug }, { status: 201 });
}

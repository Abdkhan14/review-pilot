import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findOwned } from "@/lib/business-repo";
import { getSessionUser, type SessionUser } from "@/lib/session";

/** The signed-in user, or a 401 response to return as-is. */
export async function requireUser(req: NextRequest): Promise<SessionUser | NextResponse> {
  return (await getSessionUser(req.headers)) ?? new NextResponse(null, { status: 401 });
}

/** The caller's QR, or a 401/404 to return as-is. Someone else's QR is a 404 so its existence doesn't leak. */
export async function requireOwnedQr(req: NextRequest, id: string) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  return (await findOwned(db, id, user.id)) ?? new NextResponse(null, { status: 404 });
}

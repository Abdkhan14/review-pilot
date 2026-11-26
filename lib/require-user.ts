import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/session";

/** The signed-in user, or a 401 response to return as-is. */
export async function requireUser(req: NextRequest): Promise<SessionUser | NextResponse> {
  return (await getSessionUser(req.headers)) ?? new NextResponse(null, { status: 401 });
}

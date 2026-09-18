import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

/**
 * Returns a 401 NextResponse if the request carries no valid admin cookie,
 * otherwise returns null (proceed).
 */
export async function requireAdmin(
  req: NextRequest
): Promise<NextResponse | null> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const session = token
    ? await verifySession(token).catch(() => null)
    : null;
  return session ? null : new NextResponse(null, { status: 401 });
}

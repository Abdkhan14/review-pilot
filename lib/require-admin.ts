import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { hasAdminCookie } from "@/lib/admin-cookie";

/**
 * Returns a 401 NextResponse if the request carries no valid admin cookie,
 * otherwise returns null (proceed).
 */
export async function requireAdmin(
  req: NextRequest
): Promise<NextResponse | null> {
  return (await hasAdminCookie(req.cookies)) ? null : new NextResponse(null, { status: 401 });
}

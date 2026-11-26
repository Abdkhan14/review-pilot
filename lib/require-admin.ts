import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { accessLevel } from "@/lib/route-gate";
import { getSessionUser } from "@/lib/session";

/**
 * Returns 401 when signed out, 403 when signed in without the admin role,
 * otherwise null (proceed).
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const access = accessLevel(await getSessionUser(req.headers));
  if (access === "admin") return null;
  return new NextResponse(null, { status: access === "none" ? 401 : 403 });
}

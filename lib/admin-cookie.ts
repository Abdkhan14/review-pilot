import { verifySession } from "@/lib/auth";
import { ADMIN_COOKIE } from "@/lib/session-cookie";
import type { NextRequest } from "next/server";

/** Returns true when the request carries a valid admin session cookie. */
export async function hasAdminCookie(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    await verifySession(token);
    return true;
  } catch {
    return false;
  }
}

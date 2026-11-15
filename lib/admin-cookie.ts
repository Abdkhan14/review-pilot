import { verifySession } from "@/lib/auth";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

/** Minimal cookie interface satisfied by both NextRequest.cookies and next/headers cookies(). */
export type CookieReader = { get(name: string): { value: string } | undefined };

/** Returns true when the cookie store carries a valid admin session cookie. */
export async function hasAdminCookie(cookies: CookieReader): Promise<boolean> {
  const token = cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    await verifySession(token);
    return true;
  } catch {
    return false;
  }
}

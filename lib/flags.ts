import { hasAdminCookie, type CookieReader } from "@/lib/admin-cookie";

function envOn(key: string): boolean {
  const val = process.env[key];
  return val === "1" || val === "true";
}

/** True when the new landing page is enabled or the caller is an admin. */
export async function isNewLandingEnabled(cookies: CookieReader): Promise<boolean> {
  return envOn("FF_NEW_LANDING") || hasAdminCookie(cookies);
}

/** True when the self-serve flow is enabled or the caller is an admin. */
export async function isSelfServeEnabled(cookies: CookieReader): Promise<boolean> {
  return envOn("FF_SELF_SERVE") || hasAdminCookie(cookies);
}

/**
 * True when the caller email (after auth) is in the TESTER_EMAILS list.
 * Pass the authenticated email; returns false when email is absent.
 */
export function isViewer(email: string | undefined): boolean {
  if (!email) return false;
  const list = process.env.TESTER_EMAILS ?? "";
  return list.split(",").map((e) => e.trim().toLowerCase()).includes(email.toLowerCase());
}

export type GateResult =
  | { action: "allow" }
  | { action: "redirect"; to: "/admin/login" }
  | { action: "unauthorized" };

/**
 * Pure routing decision for admin gate.
 * Called by proxy.ts with the verified-cookie boolean already resolved.
 */
export function resolveAdminGate(pathname: string, cookieValid: boolean): GateResult {
  // Login page is always public — you need to reach it to authenticate
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return { action: "allow" };
  }

  // Valid cookie → allow everything in the matcher
  if (cookieValid) {
    return { action: "allow" };
  }

  // No cookie: API admin routes → 401
  if (pathname.startsWith("/api/admin")) {
    return { action: "unauthorized" };
  }

  // No cookie: admin UI routes → redirect to login
  if (pathname.startsWith("/admin")) {
    return { action: "redirect", to: "/admin/login" };
  }

  // Anything else (e.g. /b/slug) that slips through the matcher → allow
  return { action: "allow" };
}

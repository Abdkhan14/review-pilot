import type { SessionUser } from "@/lib/session";

export type Access = "admin" | "user" | "none";

export type GateResult =
  | { action: "allow" }
  | { action: "redirect"; to: string }
  | { action: "unauthorized" }
  | { action: "forbidden" };

type Area = "admin" | "owner";

/** Which protected area a path belongs to, or null for public paths. */
export function protectedArea(pathname: string): Area | null {
  const inside = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);
  if (inside("/admin") || inside("/api/admin")) return "admin";
  if (inside("/app") || inside("/api/app")) return "owner";
  return null;
}

/** What a session is allowed to do. */
export function accessLevel(user: SessionUser | null): Access {
  if (!user) return "none";
  return user.role === "admin" ? "admin" : "user";
}

/**
 * Pure routing decision for the protected areas.
 * Called by proxy.ts with the caller's access level already resolved.
 */
export function resolveGate(pathname: string, access: Access): GateResult {
  const area = protectedArea(pathname);
  if (!area) return { action: "allow" };

  if (access === "none") {
    return pathname.startsWith("/api/")
      ? { action: "unauthorized" }
      : { action: "redirect", to: `/sign-in?callbackURL=${encodeURIComponent(pathname)}` };
  }
  if (area === "admin" && access !== "admin") return { action: "forbidden" };
  return { action: "allow" };
}

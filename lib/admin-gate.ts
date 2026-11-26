import type { SessionUser } from "@/lib/session";

export type Access = "admin" | "user" | "none";

export type GateResult =
  | { action: "allow" }
  | { action: "redirect"; to: string }
  | { action: "unauthorized" }
  | { action: "forbidden" };

/** What a session is allowed to do in the admin area. */
export function accessLevel(user: SessionUser | null): Access {
  if (!user) return "none";
  return user.role === "admin" ? "admin" : "user";
}

/**
 * Pure routing decision for the admin gate.
 * Called by proxy.ts with the caller's access level already resolved.
 */
export function resolveAdminGate(pathname: string, access: Access): GateResult {
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");
  if (!isAdminPage && !isAdminApi) return { action: "allow" };

  if (access === "admin") return { action: "allow" };
  if (access === "user") return { action: "forbidden" };
  if (isAdminApi) return { action: "unauthorized" };
  return { action: "redirect", to: `/sign-in?callbackURL=${encodeURIComponent(pathname)}` };
}

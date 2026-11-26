import { isAdminEmail, isViewer } from "@/lib/access";

export const SIGNUPS_CLOSED = "signups_closed";

export type Role = "admin" | "user";

export type SignUpDecision =
  | { allowed: true; reason: "admin" | "tester" | "self_serve"; role: Role }
  | { allowed: false; reason: typeof SIGNUPS_CLOSED };

/** Decides whether a new Google account may create a user, and with which role. */
export function canSignUp(email: string, selfServeOn: boolean): SignUpDecision {
  if (isAdminEmail(email)) return { allowed: true, reason: "admin", role: "admin" };
  if (isViewer(email)) return { allowed: true, reason: "tester", role: "user" };
  if (selfServeOn) return { allowed: true, reason: "self_serve", role: "user" };
  return { allowed: false, reason: SIGNUPS_CLOSED };
}

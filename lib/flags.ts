import { envFlagOn, isViewer } from "@/lib/access";
import { getSessionUser } from "@/lib/session";

/** Admins and testers see unreleased features before the env flags flip. */
async function seesUnreleased(headers: Headers): Promise<boolean> {
  const user = await getSessionUser(headers);
  return !!user && (user.role === "admin" || isViewer(user.email));
}

/** True when the new landing page is enabled or the caller is an admin or tester. */
export async function isNewLandingEnabled(headers: Headers): Promise<boolean> {
  return envFlagOn("FF_NEW_LANDING") || seesUnreleased(headers);
}

/** True when the self-serve flow is enabled or the caller is an admin or tester. */
export async function isSelfServeEnabled(headers: Headers): Promise<boolean> {
  return envFlagOn("FF_SELF_SERVE") || seesUnreleased(headers);
}

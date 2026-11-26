/**
 * Access rules read straight from env vars. Kept free of session imports so
 * the auth setup can use them without importing itself through lib/flags.
 */

type FlagKey = "FF_NEW_LANDING" | "FF_SELF_SERVE";

/** The flag's env value alone, ignoring who is asking. */
export function envFlagOn(key: FlagKey): boolean {
  const val = process.env[key];
  return val === "1" || val === "true";
}

function inEmailList(envKey: "ADMIN_EMAILS" | "TESTER_EMAILS", email: string | undefined): boolean {
  if (!email) return false;
  const list = process.env[envKey] ?? "";
  return list.split(",").map((e) => e.trim().toLowerCase()).includes(email.toLowerCase());
}

/** True when the email is in the TESTER_EMAILS list. */
export function isViewer(email: string | undefined): boolean {
  return inEmailList("TESTER_EMAILS", email);
}

/** True when the email is in the ADMIN_EMAILS list. */
export function isAdminEmail(email: string | undefined): boolean {
  return inEmailList("ADMIN_EMAILS", email);
}

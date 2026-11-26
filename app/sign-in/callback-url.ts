export const DEFAULT_CALLBACK_URL = "/app";

/** Keeps the post-sign-in destination on this site; anything else goes to the owner area. */
export function safeCallbackUrl(raw: string | undefined): string {
  const isSitePath = !!raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\");
  return isSitePath ? raw : DEFAULT_CALLBACK_URL;
}

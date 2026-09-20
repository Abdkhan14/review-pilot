/**
 * Builds the public scan-landing URL for a business QR code.
 * Always use this function — never inline /b/{slug} string construction.
 */
export function buildScanUrl(origin: string, slug: string): string {
  if (!origin.trim()) throw new Error("origin must not be empty");
  if (!slug.trim()) throw new Error("slug must not be empty");
  const base = origin.replace(/\/$/, "");
  return `${base}/b/${slug}`;
}

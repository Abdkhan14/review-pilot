function buildUrl(origin: string, prefix: "b" | "d" | "q", idName: string, id: string): string {
  if (!origin.trim()) throw new Error("origin must not be empty");
  if (!id.trim()) throw new Error(`${idName} must not be empty`);
  const base = origin.replace(/\/$/, "");
  return `${base}/${prefix}/${id}`;
}

/**
 * Builds the scan URL for a business created in admin.
 * Always use this function — never inline /b/{slug} string construction.
 */
export function buildScanUrl(origin: string, slug: string): string {
  return buildUrl(origin, "b", "slug", slug);
}

/**
 * Builds the scan URL for a self-serve QR.
 * Always use this function — never inline /q/{slug} string construction.
 */
export function buildQrUrl(origin: string, slug: string): string {
  return buildUrl(origin, "q", "slug", slug);
}

/**
 * Builds the public demo scan URL for a demo session.
 * Always use this function — never inline /d/{id} string construction.
 */
export function buildDemoUrl(origin: string, id: string): string {
  return buildUrl(origin, "d", "id", id);
}

/** The scan URL a business's printed QR encodes: /q/ when it has an owner, else /b/. */
export function scanUrlFor(origin: string, business: { slug: string; ownerId: string | null }): string {
  return business.ownerId ? buildQrUrl(origin, business.slug) : buildScanUrl(origin, business.slug);
}

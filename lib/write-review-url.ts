const BASE = "https://search.google.com/local/writereview";

export function buildWriteReviewUrl(placeId: string): string {
  const id = placeId.trim();
  if (!id) throw new Error("placeId must not be empty");
  return `${BASE}?placeid=${encodeURIComponent(id)}`;
}

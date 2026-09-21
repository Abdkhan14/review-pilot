/**
 * Pure function: Google Places API (New) JSON → our normalized snapshot.
 * No fetch, no env vars — safe to import anywhere and easy to unit-test.
 */

export interface PlaceSnapshot {
  placeId: string;
  name: string;
  address: string;
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  editorialSummary?: string;
  writeReviewUrl: string;
  reviews?: Array<{ rating: number; text: string; relativeTime: string }>;
  fetchedAt: string; // ISO 8601
}

// Minimal typing for the raw Places API (New) place response.
interface RawPlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  editorialSummary?: { text?: string };
  reviews?: Array<{
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
  }>;
  googleMapsLinks?: { writeAReviewUri?: string };
}

export function normalizePlaceSnapshot(raw: RawPlace): PlaceSnapshot {
  const writeReviewUrl = raw.googleMapsLinks?.writeAReviewUri;
  if (!writeReviewUrl) {
    throw new Error("Places API response missing writeAReviewUri");
  }

  return {
    placeId: raw.id ?? "",
    name: raw.displayName?.text ?? "",
    address: raw.formattedAddress ?? "",
    primaryType: raw.primaryType,
    rating: raw.rating,
    userRatingCount: raw.userRatingCount,
    editorialSummary: raw.editorialSummary?.text,
    writeReviewUrl,
    reviews: raw.reviews?.map((r) => ({
      rating: r.rating ?? 0,
      text: r.text?.text ?? "",
      relativeTime: r.relativePublishTimeDescription ?? "",
    })),
    fetchedAt: new Date().toISOString(),
  };
}

import "server-only";
import { normalizePlaceSnapshot, type PlaceSnapshot } from "./place-snapshot";

const PLACES_BASE = "https://places.googleapis.com/v1/places";

// Fields billed at Enterprise + Atmosphere tier — one call per business create.
const FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "primaryType",
  "primaryTypeDisplayName",
  "rating",
  "userRatingCount",
  "editorialSummary",
  "generativeSummary",
  "reviewSummary",
  "reviews",
  "regularOpeningHours",
  "priceLevel",
  "googleMapsLinks.writeAReviewUri",
].join(",");

/**
 * Calls Place Details (New) and returns a normalized snapshot.
 * Throws if the API key is missing, the response is non-2xx,
 * or writeAReviewUri is absent in the response.
 *
 * Pass sessionToken to close the autocomplete billing session that looked up
 * this place, so the autocomplete and detail calls are billed as one session.
 */
export async function fetchPlaceDetails(
  placeId: string,
  sessionToken?: string,
): Promise<PlaceSnapshot> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY env var is not set");

  const params = sessionToken
    ? `?sessionToken=${encodeURIComponent(sessionToken)}`
    : "";
  const url = `${PLACES_BASE}/${encodeURIComponent(placeId)}${params}`;
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": FIELD_MASK,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return normalizePlaceSnapshot(data);
}

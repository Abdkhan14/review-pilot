import "server-only";

const AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";

export type PlaceSuggestion = {
  placeId: string;
  name: string;
  address: string;
};

/**
 * Calls the Places Autocomplete (New) API and maps suggestions to a simple
 * list. The sessionToken groups autocomplete + detail calls for billing.
 */
export async function searchPlaces(
  input: string,
  sessionToken: string,
): Promise<PlaceSuggestion[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY env var is not set");

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "X-Goog-Api-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input, sessionToken }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places Autocomplete error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const suggestions: unknown[] = data.suggestions ?? [];

  return suggestions.flatMap((s) => {
    const pred = (s as { placePrediction?: { placeId?: string; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } } }).placePrediction;
    if (!pred?.placeId) return [];
    return [
      {
        placeId: pred.placeId,
        name: pred.structuredFormat?.mainText?.text ?? "",
        address: pred.structuredFormat?.secondaryText?.text ?? "",
      },
    ];
  });
}

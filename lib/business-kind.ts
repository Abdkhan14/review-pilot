export type BusinessKind = "restaurant" | "salon" | "generic";

const SALON_TOKENS = ["salon", "barber", "beauty", "spa", "hair"];
const RESTAURANT_TOKENS = ["restaurant", "cafe", "bar", "pizza", "bakery", "meal"];

/** Whole-token match so "spa" does not hit "space" and "bar" does not hit "barber". */
function hasToken(primaryType: string, keyword: string): boolean {
  return new RegExp(`(^|_)${keyword}($|_)`).test(primaryType);
}

/**
 * Maps a Google Places primaryType string to one of three business kinds.
 * Returns "generic" when primaryType is missing or does not match either set.
 */
export function businessKind(primaryType: string | undefined): BusinessKind {
  const type = primaryType?.toLowerCase() ?? "";
  if (SALON_TOKENS.some((token) => hasToken(type, token))) return "salon";
  if (RESTAURANT_TOKENS.some((token) => hasToken(type, token))) return "restaurant";
  return "generic";
}

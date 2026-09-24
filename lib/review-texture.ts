import type { TextureKind } from "./review-recipe";

type Rng = () => number;

// Common contractions where dropping the apostrophe reads as a natural typing slip.
// Ordered longest-first so greedier patterns match before short ones.
const CONTRACTION_PAIRS: [RegExp, string][] = [
  [/\bwouldn't\b/g, "wouldnt"],
  [/\bcouldn't\b/g, "couldnt"],
  [/\bshouldn't\b/g, "shouldnt"],
  [/\bdidn't\b/g, "didnt"],
  [/\bwasn't\b/g, "wasnt"],
  [/\baren't\b/g, "arent"],
  [/\bdon't\b/g, "dont"],
  [/\bthat's\b/g, "thats"],
  [/\bcan't\b/g, "cant"],
  [/\bI'm\b/g, "Im"],
  [/\bit's\b/g, "its"],
];

/**
 * Applies at most one surface-level imperfection to a review text.
 * - "casual": strips the apostrophe from one random contraction.
 * - "run_on": drops the final period, or joins the last two sentences with a comma.
 * - "clean": returns text unchanged.
 *
 * Never touches the first word (brand/shop names often lead) and never stacks
 * transforms — this function is called once per draft, on at most one draft per trio.
 */
export function applyTexture(text: string, texture: TextureKind, rng: Rng = Math.random): string {
  if (texture === "clean") return text;

  if (texture === "casual") {
    // Collect all match positions across all contraction patterns.
    type Match = { start: number; length: number; pattern: RegExp; replacement: string };
    const candidates: Match[] = [];
    for (const [pattern, replacement] of CONTRACTION_PAIRS) {
      // Reset lastIndex for global patterns.
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        // Skip contractions that begin at position 0 (the first word of the review).
        if (m.index === 0) continue;
        candidates.push({ start: m.index, length: m[0].length, pattern, replacement });
      }
    }
    if (candidates.length === 0) return text;
    const chosen = candidates[Math.floor(rng() * candidates.length)];
    // Replace only that single occurrence by slicing around the match position.
    return (
      text.slice(0, chosen.start) +
      chosen.replacement +
      text.slice(chosen.start + chosen.length)
    );
  }

  if (texture === "run_on") {
    const trimmed = text.trimEnd();
    if (!trimmed.endsWith(".")) return text;

    // Either drop the final period, or join the last two sentences with a comma.
    if (rng() < 0.5) {
      return trimmed.slice(0, -1);
    }
    // Find the second-to-last period to attempt a comma splice.
    const lastPeriod = trimmed.lastIndexOf(".", trimmed.length - 2);
    if (lastPeriod === -1) return trimmed.slice(0, -1);
    const before = trimmed.slice(0, lastPeriod);
    const after = trimmed.slice(lastPeriod + 1).trimStart();
    if (after.length === 0) return trimmed.slice(0, -1);
    // Lower-case the first character of the joined sentence.
    const joined = before + ", " + after[0].toLowerCase() + after.slice(1);
    return joined;
  }

  return text;
}

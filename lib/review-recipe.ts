import LENGTHS_JSON from "./recipes/lengths.json";
import VOICES_JSON from "./recipes/voices.json";
import OPENERS_JSON from "./recipes/openers.json";
import TEXTURES_JSON from "./recipes/textures.json";

// ─── Types ────────────────────────────────────────────────────────────────────

/** An id from lengths.json, e.g. "len_3". */
export type LengthBucket = string;
/** An id from voices.json, e.g. "v_specific". */
export type Voice = string;
/** An id from openers.json, e.g. "op_i_first". */
export type Opener = string;

export type ItemPolicy = "must" | "optional";
export type ProseFactPolicy = "allow" | "forbid";
/** "clean" or a slip id from textures.json, e.g. "apostrophe_contraction". */
export type TextureKind = "clean" | string;
/** "clean" leaves the word intact; "swap" transposes two adjacent interior letters in one word. */
export type TypoKind = "clean" | "swap";

export type ReviewRecipe = {
  length: LengthBucket;
  voice: Voice;
  opener: Opener;
  item: ItemPolicy;
  proseFact: ProseFactPolicy;
  texture: TextureKind;
  typo: TypoKind;
};

// ─── Catalogs (derived from JSON) ─────────────────────────────────────────────

export const ALL_LENGTH_IDS: readonly string[] = LENGTHS_JSON.map((l) => l.id);
export const ALL_VOICE_IDS: readonly string[] = VOICES_JSON.map((v) => v.id);
export const ALL_OPENER_IDS: readonly string[] = OPENERS_JSON.map((o) => o.id);
export const ALL_TEXTURE_IDS: readonly string[] = TEXTURES_JSON.map((t) => t.id);

// ─── Sampler ──────────────────────────────────────────────────────────────────

type Rng = () => number;

function pick<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(arr: T[], rng: Rng): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Samples three review recipes with these trio constraints:
 * - Three distinct length ids (shuffle of 12 options, take first three).
 * - Item policy is independent "must" | "optional" per draft (no skip).
 * - At most one "allow" prose-fact policy.
 * - At most one non-clean texture (30% chance all three are clean).
 * - At most one "swap" typo (70% chance all three are clean).
 *   The swap always lands on a texture-clean draft so grammar slip and typo
 *   never stack on the same review.
 *
 * Every other pick (voice, opener, the non-clean texture id) is independent
 * uniform random with no weighting.
 */
export function sampleRecipeTrio(rng: Rng = Math.random): [ReviewRecipe, ReviewRecipe, ReviewRecipe] {
  // Lengths: three distinct ids from a shuffle of the catalog.
  const shuffledLengths = [...ALL_LENGTH_IDS];
  shuffle(shuffledLengths, rng);
  const lengths = shuffledLengths.slice(0, 3) as [string, string, string];

  // Item policy: independent uniform "must" | "optional" per draft.
  const itemSlots: ItemPolicy[] = [
    pick(["must", "optional"] as const, rng),
    pick(["must", "optional"] as const, rng),
    pick(["must", "optional"] as const, rng),
  ];

  // Prose fact: at most one "allow".
  const proseFactSlots: ProseFactPolicy[] = ["allow", "forbid", "forbid"];
  shuffle(proseFactSlots, rng);

  // Texture: 0 or 1 non-clean. 30% chance all three stay clean.
  let textureSlots: TextureKind[];
  if (rng() < 0.3) {
    textureSlots = ["clean", "clean", "clean"];
  } else {
    textureSlots = [pick(ALL_TEXTURE_IDS, rng), "clean", "clean"];
    shuffle(textureSlots, rng);
  }

  // Typo: 0 or 1 swap. 70% chance all three stay clean.
  // When a swap is added it must land on a texture-clean draft so a grammar
  // slip and a typo never appear in the same review.
  const typoSlots: TypoKind[] = ["clean", "clean", "clean"];
  if (rng() >= 0.7) {
    const cleanTextureIndices = textureSlots
      .map((t, i) => (t === "clean" ? i : -1))
      .filter((i) => i !== -1);
    if (cleanTextureIndices.length > 0) {
      const chosen = cleanTextureIndices[Math.floor(rng() * cleanTextureIndices.length)];
      typoSlots[chosen] = "swap";
    }
  }

  return [0, 1, 2].map((i) => ({
    length: lengths[i],
    voice: pick(ALL_VOICE_IDS, rng),
    opener: pick(ALL_OPENER_IDS, rng),
    item: itemSlots[i],
    proseFact: proseFactSlots[i],
    texture: textureSlots[i],
    typo: typoSlots[i],
  })) as [ReviewRecipe, ReviewRecipe, ReviewRecipe];
}

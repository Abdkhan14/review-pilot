export type LengthBucket = "one_liner" | "short" | "medium" | "ramble";
export type Voice = "clipped" | "hedged" | "specific" | "tangent" | "just_facts";
export type Opener = "i_first" | "dish_first" | "came_here" | "no_first_person";
export type ItemPolicy = "must" | "optional" | "skip";
export type ProseFactPolicy = "allow" | "forbid";
export type TextureKind = "clean" | "casual" | "run_on";

export type ReviewRecipe = {
  length: LengthBucket;
  voice: Voice;
  opener: Opener;
  item: ItemPolicy;
  proseFact: ProseFactPolicy;
  texture: TextureKind;
};

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

const ALL_LENGTHS: readonly LengthBucket[] = ["one_liner", "short", "medium", "ramble"];
const ALL_VOICES: readonly Voice[] = ["clipped", "hedged", "specific", "tangent", "just_facts"];
const ALL_OPENERS: readonly Opener[] = ["i_first", "dish_first", "came_here", "no_first_person"];

/**
 * Samples three review recipes with these trio constraints:
 * - At least two distinct length buckets.
 * - Exactly one "skip" item policy; the other two are "must" or "optional".
 * - At most one "allow" prose-fact policy.
 * - At most one non-clean texture (30% chance all three are clean).
 */
export function sampleRecipeTrio(rng: Rng = Math.random): [ReviewRecipe, ReviewRecipe, ReviewRecipe] {
  // Lengths: keep re-sampling until we get ≥ 2 distinct buckets.
  let lengths: [LengthBucket, LengthBucket, LengthBucket];
  do {
    lengths = [pick(ALL_LENGTHS, rng), pick(ALL_LENGTHS, rng), pick(ALL_LENGTHS, rng)];
  } while (new Set(lengths).size < 2);

  // Item policy: exactly one "skip", others "must" or "optional".
  const itemSlots: ItemPolicy[] = [
    "skip",
    pick(["must", "optional"] as const, rng),
    pick(["must", "optional"] as const, rng),
  ];
  shuffle(itemSlots, rng);

  // Prose fact: at most one "allow".
  const proseFactSlots: ProseFactPolicy[] = ["allow", "forbid", "forbid"];
  shuffle(proseFactSlots, rng);

  // Texture: 0 or 1 non-clean. 30% chance all three stay clean.
  let textureSlots: TextureKind[];
  if (rng() < 0.3) {
    textureSlots = ["clean", "clean", "clean"];
  } else {
    textureSlots = [pick(["casual", "run_on"] as const, rng), "clean", "clean"];
    shuffle(textureSlots, rng);
  }

  return [0, 1, 2].map((i) => ({
    length: lengths[i],
    voice: pick(ALL_VOICES, rng),
    opener: pick(ALL_OPENERS, rng),
    item: itemSlots[i],
    proseFact: proseFactSlots[i],
    texture: textureSlots[i],
  })) as [ReviewRecipe, ReviewRecipe, ReviewRecipe];
}

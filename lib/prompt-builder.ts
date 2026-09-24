import type { PlaceSnapshot } from "./place-snapshot";
import type { ReviewRecipe } from "./review-recipe";
import type { LengthBucket, Voice, Opener } from "./review-recipe";
import { DRAFT_COUNT } from "./catalog-items";
import RESTAURANT_POOL from "./angles/restaurant.json";
import SALON_POOL from "./angles/salon.json";
import GENERIC_POOL from "./angles/generic.json";

export type PromptMessage = { role: "system" | "user"; content: string };
export type Angle = { label: string; pick: string };

export type BuildPromptInput = {
  /** Draft slot: determines the "id" field in the returned JSON. */
  id: "a" | "b" | "c";
  snapshot: PlaceSnapshot;
  angle: Angle;
  recipe: ReviewRecipe;
  starIntent?: number;
  /** The catalog item assigned to this draft. Undefined when recipe.item === "skip". */
  assignedItem?: string;
  /** Prose-only lines from shop notes (item list already stripped out). */
  customInstructions?: string;
};

const SALON_TOKENS = ["salon", "barber", "beauty", "spa", "hair"];
const RESTAURANT_TOKENS = ["restaurant", "cafe", "bar", "pizza", "bakery", "meal"];

/** Returns DRAFT_COUNT random angles from the pool that matches primaryType. */
export function anglesForPrimaryType(primaryType: string | undefined): Angle[] {
  const type = primaryType?.toLowerCase() ?? "";
  let pool: Angle[];
  if (SALON_TOKENS.some((token) => hasToken(type, token))) {
    pool = SALON_POOL as Angle[];
  } else if (RESTAURANT_TOKENS.some((token) => hasToken(type, token))) {
    pool = RESTAURANT_POOL as Angle[];
  } else {
    pool = GENERIC_POOL as Angle[];
  }
  return pickRandom(pool, DRAFT_COUNT);
}

/** Builds the two-message prompt for a single review draft. */
export function buildPrompt(input: BuildPromptInput): PromptMessage[] {
  const starIntent = input.starIntent ?? 5;
  return [
    { role: "system", content: systemMessage(input, starIntent) },
    { role: "user", content: userMessage(input) },
  ];
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function systemMessage(input: BuildPromptInput, starIntent: number): string {
  const { angle, recipe, assignedItem } = input;

  // null = omit the line entirely; "" = keep as a blank separator.
  const lines: (string | null)[] = [
    "You write a single Google review for a real customer who just visited this business.",
    "",
    lengthInstruction(recipe.length),
    voiceInstruction(recipe.voice),
    openerInstruction(recipe.opener) || null,
    "",
    "Rules:",
    "- Do not sell the place. Banned closers: \"will be back\", \"highly recommend\", \"if you're in the area\", \"must try\", \"hidden gem\", \"10/10\", \"exceeded expectations\", \"from start to finish\", \"overall experience\"",
    "- No exclamation marks",
    "- No filler words: \"absolutely\", \"amazing\", \"fantastic\", \"delightful\", \"impeccable\", \"seamless\", \"mouth-watering\", \"culinary\", \"nestled\", \"crafted\", \"elevated\", \"I highly recommend\", \"definitely recommend\", \"five stars\"",
    "- No em-dashes. No \"it's worth noting\"",
    "- No hashtags",
    "- First person",
    `- Write in the tone of a ${starIntent}-star review. Do not set Google stars or fill in the Google form.`,
    "- Do not name staff unless shop notes include their name",
    angleInstruction(angle, recipe.item, assignedItem),
    itemInstruction(recipe.item, assignedItem) || null,
    proseFactInstruction(recipe.proseFact),
    textureInstruction(recipe.texture) || null,
    "",
    "Return JSON only, this exact shape:",
    `{ "id": "${input.id}", "angle": "${angle.label}", "text": "..." }`,
  ];

  return lines.filter((line): line is string => line !== null).join("\n");
}

function lengthInstruction(length: LengthBucket): string {
  const map: Record<LengthBucket, string> = {
    one_liner: "Length: Write exactly 1 sentence.",
    short: "Length: Write 2–3 sentences.",
    medium: "Length: Write 4–5 sentences.",
    ramble: "Length: Write 6–8 sentences, mixing short and longer ones.",
  };
  return map[length];
}

function voiceInstruction(voice: Voice): string {
  const map: Record<Voice, string> = {
    clipped: "Voice: Be direct and punchy. Short observations only.",
    hedged: "Voice: Use hedged language: \"pretty good\", \"not bad\", \"was fine\". One mild nit is fine — the review stays positive overall.",
    specific: "Voice: Be specific about one concrete detail — texture, timing, temperature, or size.",
    tangent: "Voice: Include one aside that is not about the main subject and not a sales pitch.",
    just_facts: "Voice: State what happened. Observations, not opinions.",
  };
  return map[voice];
}

function openerInstruction(opener: Opener): string {
  const map: Record<Opener, string> = {
    i_first: "",
    dish_first: "Opener: Start the first sentence with the dish or service name, not \"I\".",
    came_here: "Opener: Start the first sentence with a phrase like \"Came here…\", \"Stopped by…\", or \"Went for…\".",
    no_first_person: "Opener: Do not start the first sentence with \"I\".",
  };
  return map[opener];
}

function angleInstruction(angle: Angle, item: string, assignedItem: string | undefined): string {
  if (item === "skip") {
    return `- Angle: "${angle.label}". Focus on atmosphere, timing, space, or a sensory moment — do not name any catalog item.`;
  }
  if (assignedItem) {
    return `- Angle: "${angle.label}". The assigned item for this draft is ${assignedItem}.`;
  }
  return `- Angle: "${angle.label}". If shop notes list items, pick: ${angle.pick}.`;
}

function itemInstruction(item: string, assignedItem: string | undefined): string {
  if (item === "skip") {
    return "- Do not name any catalog item. Write about atmosphere, timing, the bill, or a sensory moment instead.";
  }
  if (!assignedItem) return "";
  if (item === "must") {
    return `- Name ${assignedItem} once, in passing — not the entire point of the review.`;
  }
  return `- ${assignedItem} may appear if it fits naturally. Do not force it.`;
}

function proseFactInstruction(proseFact: string): string {
  if (proseFact === "allow") {
    return "- Shop notes may inform atmosphere or staff details if relevant.";
  }
  return "- Do not name staff or reference prose-only details from shop notes (e.g. \"always mention X\"). Write from the experience.";
}

function textureInstruction(texture: string): string {
  if (texture === "clean") return "";
  if (texture === "casual") return "- Grammar: contractions are fine; one missing apostrophe is natural.";
  return "- Grammar: one comma splice or a missing final period is fine.";
}

function userMessage(input: BuildPromptInput): string {
  const { snapshot, customInstructions } = input;
  const lines: string[] = [`Shop: ${snapshot.name}`];

  if (snapshot.primaryType) {
    lines.push(`Type: ${snapshot.primaryType}`);
  }
  lines.push(`Address: ${snapshot.address}`);

  if (snapshot.rating != null) {
    const count =
      snapshot.userRatingCount != null
        ? ` (${snapshot.userRatingCount} reviews)`
        : "";
    lines.push(`Rating: ${snapshot.rating}${count}`);
  }

  if (snapshot.editorialSummary) {
    lines.push(`Summary: ${snapshot.editorialSummary}`);
  }

  const notes = customInstructions?.trim();
  if (notes) {
    lines.push("", "Shop notes:", notes);
  }

  // Include example Google reviews only when there are no shop notes.
  if (!notes) {
    const reviews = snapshot.reviews?.filter((r) => r.text.trim() !== "") ?? [];
    if (reviews.length > 0) {
      lines.push(
        "",
        "Existing Google reviews (examples only — do not copy):",
        ...reviews.map(
          (r) => `- ${r.rating} stars, ${r.relativeTime}: ${r.text}`,
        ),
      );
    }
  }

  return lines.join("\n");
}

/** Fisher-Yates shuffle; returns n items chosen at random from pool. */
function pickRandom<T>(pool: T[], n: number): T[] {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

/** Whole-token match so "spa" does not hit "space" and "bar" does not hit "barber". */
function hasToken(primaryType: string, keyword: string): boolean {
  return new RegExp(`(^|_)${keyword}($|_)`).test(primaryType);
}

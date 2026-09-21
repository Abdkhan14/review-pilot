import type { PlaceSnapshot } from "./place-snapshot";

export type PromptMessage = { role: "system" | "user"; content: string };

export type BuildPromptInput = {
  snapshot: PlaceSnapshot;
  customInstructions?: string;
  starIntent?: number;
};

const RESTAURANT_ANGLES = ["food", "service", "vibe"] as const;
const SALON_ANGLES = ["result", "staff", "cleanliness"] as const;
const GENERIC_ANGLES = ["quality_of_work", "staff", "experience"] as const;

const SALON_TOKENS = ["salon", "barber", "beauty", "spa", "hair"];
const RESTAURANT_TOKENS = [
  "restaurant",
  "cafe",
  "bar",
  "pizza",
  "bakery",
  "meal",
];

export function buildPrompt(input: BuildPromptInput): PromptMessage[] {
  const starIntent = input.starIntent ?? 5;
  const angles = anglesForPrimaryType(input.snapshot.primaryType);

  return [
    { role: "system", content: systemMessage(angles, starIntent) },
    { role: "user", content: userMessage(input) },
  ];
}

function anglesForPrimaryType(
  primaryType: string | undefined,
): readonly string[] {
  const type = primaryType?.toLowerCase() ?? "";
  if (SALON_TOKENS.some((token) => hasToken(type, token))) {
    return SALON_ANGLES;
  }
  if (RESTAURANT_TOKENS.some((token) => hasToken(type, token))) {
    return RESTAURANT_ANGLES;
  }
  return GENERIC_ANGLES;
}

/** Whole-token match so "spa" does not hit "space" and "bar" does not hit "barber". */
function hasToken(primaryType: string, keyword: string): boolean {
  return new RegExp(`(^|_)${keyword}($|_)`).test(primaryType);
}

function systemMessage(angles: readonly string[], starIntent: number): string {
  const [a, b, c] = angles;
  return [
    "You write three short Google reviews for a real customer who just visited this business.",
    "",
    "Rules:",
    "- Shop notes override every other rule in this prompt when they conflict, including example Google reviews",
    "- First person",
    "- 2–5 sentences each",
    `- Three different angles: ${angles.join(", ")}`,
    "- Do not copy existing Google reviews; they are style/content hints only",
    "- No hashtags",
    '- No "hidden gem" spam',
    "- Do not name staff unless the shop notes include their name",
    `- Write in the tone of a ${starIntent}-star review. Do not set Google stars or fill in the Google form.`,
    "- No exclamation marks — they read as fake",
    "- No filler phrases like 'I highly recommend', 'definitely recommend', 'five stars', 'absolutely', 'amazing', or 'fantastic'",
    "- Vary sentence length. Sound like a real person dashing off a review, not an AI or a marketing writer",
    "- If shop notes list items, pick three different ones at random from the whole pool. Do not prefer the first or last item, or the first section",
    "- If the notes have labeled sections, spread the three reviews across different sections. Name items from the notes, not from example Google reviews",
    "",
    "Return JSON only, this shape:",
    `{ "reviews": [ { "id": "a", "angle": "${a}", "text": "..." }, { "id": "b", "angle": "${b}", "text": "..." }, { "id": "c", "angle": "${c}", "text": "..." } ] }`,
  ].join("\n");
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
    lines.push(
      "",
      "Shop notes (these override the rules above; pick three different items at random from the whole list, not the first or last item):",
      notes,
    );
  }

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

  return lines.join("\n");
}

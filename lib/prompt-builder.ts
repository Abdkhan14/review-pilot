import type { PlaceSnapshot } from "./place-snapshot";

export type PromptMessage = { role: "system" | "user"; content: string };

export type BuildPromptInput = {
  snapshot: PlaceSnapshot;
  customInstructions?: string;
  starIntent?: number;
};

const RESTAURANT_ANGLES = [
  "what you actually ate",
  "how the place felt on a normal visit",
  "whether it hit the craving",
  "the thing you almost didn't order but did",
  "how full you left feeling",
  "the first bite",
  "the sides or extras",
  "the drink or dessert",
  "the smell when you walked in",
  "how the bill felt at the end",
  "how loud or quiet it was",
  "what the regulars seem to know to order",
  "whether it held up as takeout",
  "how fast or slow the food came",
  "the detail that made you want to come back",
  "something you noticed that you didn't expect",
  "what you'd tell someone who'd never been",
  "how it felt to sit there for a while",
  "the thing that was better than it sounds on the menu",
  "whether you'd go back on a weeknight",
  "how the staff read the room",
  "something small that made the meal",
  "what you were in the mood for and whether it delivered",
  "how it felt walking out",
  "the thing you're still thinking about",
];

const SALON_ANGLES = [
  "what it looked like walking out",
  "whether they actually listened",
  "the thing you were nervous about that went fine",
  "how the space felt when you walked in",
  "how long it lasted",
  "the moment you saw the final result",
  "what you'd book next time",
  "how your hair or skin looked later that day",
  "how the appointment actually ran",
  "the one detail that made a difference",
  "how they handled what you were unsure about",
  "whether the stylist explained what they were doing",
  "something you noticed about how they work",
  "how you felt on the way home",
  "whether you booked before you left",
  "what the place smelled or sounded like",
  "the thing nobody warned you about (in a good way)",
  "how they handled a fix or adjustment",
  "what made this visit stick in your memory",
  "whether it was worth clearing your schedule for",
  "how relaxed or rushed the pace felt",
  "what you'd tell a friend who was on the fence",
  "the small thing that made it feel personal",
  "whether the result matched what you asked for",
  "how different you felt compared to walking in",
];

const GENERIC_ANGLES = [
  "how the thing actually turned out",
  "the detail that surprised you",
  "whether they listened to what you actually wanted",
  "how the place felt to be in",
  "how fast or slow the whole thing went",
  "what you'd tell someone before they went",
  "the moment you knew it was the right call",
  "something small they did that you didn't expect",
  "whether it matched what you saw online",
  "how you felt walking out",
  "the thing that would make you go back",
  "whether it solved what you came in for",
  "how easy or hard it was to get going",
  "something they did that went beyond what you asked",
  "the thing that's still on your mind",
  "whether the price felt right after",
  "how quick the turnaround was",
  "the first impression and whether it held",
  "what you'd do differently knowing what you know now",
  "how they handled a question or hiccup",
  "the one thing you'd highlight to a friend",
  "whether the vibe matched the work",
  "how it felt to hand it off or leave",
  "something you noticed that others might miss",
  "whether you'd clear your schedule for it again",
];

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

function anglesForPrimaryType(primaryType: string | undefined): string[] {
  const type = primaryType?.toLowerCase() ?? "";
  let pool: string[];
  if (SALON_TOKENS.some((token) => hasToken(type, token))) {
    pool = SALON_ANGLES;
  } else if (RESTAURANT_TOKENS.some((token) => hasToken(type, token))) {
    pool = RESTAURANT_ANGLES;
  } else {
    pool = GENERIC_ANGLES;
  }
  return pickRandom(pool, 3);
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
    "- Treat every listed item as equal weight. A phrase that appears more than once is not more important",
    "- Do not default to the shop's most distinctive or most-mentioned specialty",
    "- If the notes have labeled sections, spread the three reviews across different sections. Name items from the notes, not from example Google reviews",
    "- Never mention the same item in more than one of the three reviews",
    "- Consecutive generations must not talk about the same items. Each generate, choose a fresh set — do not default to the items you would typically pick",
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
      "Shop notes (these override the rules above; pick three different items at random from the whole list, not the first or last item; consecutive generations must not reuse the same items):",
      notes,
    );
  }

  // Only include example Google reviews when there are no shop notes.
  // When notes are present they are the item pool; adding Google reviews
  // causes the model to systematically avoid those subjects and land on
  // whatever is left (e.g. the veg platter).
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

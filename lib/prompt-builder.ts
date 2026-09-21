import type { PlaceSnapshot } from "./place-snapshot";
import { DRAFT_COUNT } from "./catalog-items";

export type PromptMessage = { role: "system" | "user"; content: string };

export type AssignedItem = { id: "a" | "b" | "c"; name: string };

export type BuildPromptInput = {
  snapshot: PlaceSnapshot;
  customInstructions?: string;
  starIntent?: number;
  /** Items picked by the server. When present, each review must cover its assigned item. */
  assignedItems?: AssignedItem[];
};

type Angle = { label: string; pick: string };

const RESTAURANT_ANGLES: Angle[] = [
  {
    label: "what you actually ate",
    pick: "a main you ordered as the meal (platter, wrap, pizza) — not a side, dip, or garnish",
  },
  {
    label: "how the place felt on a normal visit",
    pick: "an everyday main, not a specialty showpiece or a side",
  },
  {
    label: "whether it hit the craving",
    pick: "the specific main you came hungry for — not a snack, side, or drink",
  },
  {
    label: "the thing you almost didn't order but did",
    pick: "an unusual or off-your-usual item, not the shop's default specialty or a side",
  },
  {
    label: "how full you left feeling",
    pick: "a large platter, combo, or shareable — not a side, dip, or dessert",
  },
  {
    label: "the first bite",
    pick: "the main you started with, not a garnish, sauce, or extra",
  },
  {
    label: "the sides or extras",
    pick: "a side, dip, salad, or extra — not a main",
  },
  {
    label: "the drink or dessert",
    pick: "a drink or dessert — not a main or a side",
  },
  {
    label: "the smell when you walked in",
    pick: "something aromatic from the notes (grilled, garlic, coffee) if you name food at all; skip a bland side",
  },
  {
    label: "how the bill felt at the end",
    pick: "a priced main or combo that actually moved the tab — not a cheap dip or extra",
  },
  {
    label: "how loud or quiet it was",
    pick: "whatever main was on the table if you mention food; do not make a side the takeaway",
  },
  {
    label: "what the regulars seem to know to order",
    pick: "a less-obvious main regulars would know, not the first listed platter and not a side",
  },
  {
    label: "whether it held up as takeout",
    pick: "a main that travels (wrap, platter, pizza) — not a drink, dip, or salad",
  },
  {
    label: "how fast or slow the food came",
    pick: "the main you were waiting on, not a side that came first",
  },
  {
    label: "the detail that made you want to come back",
    pick: "a distinctive main worth a return trip — not fries, a dip, or a generic extra",
  },
  {
    label: "something you noticed that you didn't expect",
    pick: "an unexpected dish (odd combo, surprising special), not the obvious house staple or a side",
  },
  {
    label: "what you'd tell someone who'd never been",
    pick: "the one main you'd send a first-timer to — not a side or add-on",
  },
  {
    label: "how it felt to sit there for a while",
    pick: "the main (and maybe a drink) you sat with; do not center a side",
  },
  {
    label: "the thing that was better than it sounds on the menu",
    pick: "a dish whose name undersells it or sounds like an odd combo — not a straightforward specialty and not a side",
  },
  {
    label: "whether you'd go back on a weeknight",
    pick: "an everyday main, not a dessert, special-occasion platter, or side",
  },
  {
    label: "how the staff read the room",
    pick: "whatever main they steered you toward or timed well — not a side as the takeaway",
  },
  {
    label: "something small that made the meal",
    pick: "a side, extra, sauce, or small add-on — this is the one angle that should not be a main",
  },
  {
    label: "what you were in the mood for and whether it delivered",
    pick: "the main you specifically came for, not a backup side or extra",
  },
  {
    label: "how it felt walking out",
    pick: "the main you just ate, not a leftover side or the bill as a dish",
  },
  {
    label: "the thing you're still thinking about",
    pick: "the dish that stuck — a distinctive main or unexpected item, not a generic side",
  },
];

const SALON_ANGLES: Angle[] = [
  {
    label: "what it looked like walking out",
    pick: "the main service you booked (cut, color, tattoo, treatment) — not an add-on",
  },
  {
    label: "whether they actually listened",
    pick: "the specific service you asked for, not a default package or extra",
  },
  {
    label: "the thing you were nervous about that went fine",
    pick: "a bigger or riskier service (cover-up, color correction, first tattoo) — not a simple trim or add-on",
  },
  {
    label: "how the space felt when you walked in",
    pick: "skip naming a service unless it was happening around you; do not make a small add-on the takeaway",
  },
  {
    label: "how long it lasted",
    pick: "a service whose durability matters (color, tattoo, treatment) — not a wash or quick extra",
  },
  {
    label: "the moment you saw the final result",
    pick: "the main booked service, not an aftercare product or add-on",
  },
  {
    label: "what you'd book next time",
    pick: "a different service than this visit, from another section of the notes if they have them",
  },
  {
    label: "how your hair or skin looked later that day",
    pick: "the main result service, not a product they sold you on the way out",
  },
  {
    label: "how the appointment actually ran",
    pick: "the main service's pacing — not a five-minute extra",
  },
  {
    label: "the one detail that made a difference",
    pick: "a specific technique or extra (aftercare, lining, toner) — not the whole headline service",
  },
  {
    label: "how they handled what you were unsure about",
    pick: "the service you were on the fence about, not the one you were already sure of",
  },
  {
    label: "whether the stylist explained what they were doing",
    pick: "the main service they walked you through, not a throwaway extra",
  },
  {
    label: "something you noticed about how they work",
    pick: "technique on the main service, not a product name unless the notes list it",
  },
  {
    label: "how you felt on the way home",
    pick: "the main result, not an add-on",
  },
  {
    label: "whether you booked before you left",
    pick: "name the next service you'd book from the notes, different from today's",
  },
  {
    label: "what the place smelled or sounded like",
    pick: "atmosphere; skip shop-note items unless one is genuinely sensory",
  },
  {
    label: "the thing nobody warned you about (in a good way)",
    pick: "an unexpected extra or technique, not the headline service you booked",
  },
  {
    label: "how they handled a fix or adjustment",
    pick: "a correction, cover-up, or redo — not a first-time simple service",
  },
  {
    label: "what made this visit stick in your memory",
    pick: "the distinctive service from the notes, not a generic add-on",
  },
  {
    label: "whether it was worth clearing your schedule for",
    pick: "a longer or bigger service, not a quick add-on",
  },
  {
    label: "how relaxed or rushed the pace felt",
    pick: "the main appointment, not a bolt-on extra",
  },
  {
    label: "what you'd tell a friend who was on the fence",
    pick: "the service you'd send them for — a main offering, not an extra",
  },
  {
    label: "the small thing that made it feel personal",
    pick: "a small extra or aftercare, not the main service",
  },
  {
    label: "whether the result matched what you asked for",
    pick: "the main booked service, not an add-on they threw in",
  },
  {
    label: "how different you felt compared to walking in",
    pick: "the main transformation service, not a minor extra",
  },
];

const GENERIC_ANGLES: Angle[] = [
  {
    label: "how the thing actually turned out",
    pick: "the main thing you came in for, not an extra or add-on",
  },
  {
    label: "the detail that surprised you",
    pick: "something unexpected from the notes, not the headline offering",
  },
  {
    label: "whether they listened to what you actually wanted",
    pick: "the specific item or service you asked for, not a default package",
  },
  {
    label: "how the place felt to be in",
    pick: "atmosphere; if you name work, name the main thing you were there for — not a side extra",
  },
  {
    label: "how fast or slow the whole thing went",
    pick: "the main job or service, not a tiny add-on",
  },
  {
    label: "what you'd tell someone before they went",
    pick: "the one main offering you'd point them to, not a minor extra",
  },
  {
    label: "the moment you knew it was the right call",
    pick: "the main thing that justified coming, not an incidental extra",
  },
  {
    label: "something small they did that you didn't expect",
    pick: "a small extra from the notes, not the main job",
  },
  {
    label: "whether it matched what you saw online",
    pick: "the main advertised offering, not an unlisted extra",
  },
  {
    label: "how you felt walking out",
    pick: "the main result, not a leftover add-on",
  },
  {
    label: "the thing that would make you go back",
    pick: "a distinctive main offering, not a minor extra",
  },
  {
    label: "whether it solved what you came in for",
    pick: "the main problem or item, not a side extra",
  },
  {
    label: "how easy or hard it was to get going",
    pick: "the start of the main service, not an add-on",
  },
  {
    label: "something they did that went beyond what you asked",
    pick: "an extra or upgrade from the notes, not the thing you booked",
  },
  {
    label: "the thing that's still on your mind",
    pick: "the distinctive main result, not a generic extra",
  },
  {
    label: "whether the price felt right after",
    pick: "a priced main item, not a cheap add-on",
  },
  {
    label: "how quick the turnaround was",
    pick: "the main job, not a five-minute extra",
  },
  {
    label: "the first impression and whether it held",
    pick: "the main offering, not a first-thing extra at the door",
  },
  {
    label: "what you'd do differently knowing what you know now",
    pick: "a different item from the notes you'd pick next time",
  },
  {
    label: "how they handled a question or hiccup",
    pick: "around the main service, not a throwaway extra",
  },
  {
    label: "the one thing you'd highlight to a friend",
    pick: "a main offering, not a side extra",
  },
  {
    label: "whether the vibe matched the work",
    pick: "the main work, not an add-on",
  },
  {
    label: "how it felt to hand it off or leave",
    pick: "the completed main thing, not a leftover extra",
  },
  {
    label: "something you noticed that others might miss",
    pick: "a small or specific item from the notes, not the obvious specialty",
  },
  {
    label: "whether you'd clear your schedule for it again",
    pick: "a substantial offering, not a tiny extra",
  },
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
    { role: "system", content: systemMessage(angles, starIntent, input.assignedItems) },
    { role: "user", content: userMessage(input) },
  ];
}

function anglesForPrimaryType(primaryType: string | undefined): Angle[] {
  const type = primaryType?.toLowerCase() ?? "";
  let pool: Angle[];
  if (SALON_TOKENS.some((token) => hasToken(type, token))) {
    pool = SALON_ANGLES;
  } else if (RESTAURANT_TOKENS.some((token) => hasToken(type, token))) {
    pool = RESTAURANT_ANGLES;
  } else {
    pool = GENERIC_ANGLES;
  }
  return pickRandom(pool, DRAFT_COUNT);
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

function systemMessage(
  angles: readonly Angle[],
  starIntent: number,
  assignedItems?: AssignedItem[],
): string {
  const [a, b, c] = angles;
  const angleLines = angles
    .map((ang) => `  - ${ang.label}: ${ang.pick}`)
    .join("\n");

  const itemRules =
    assignedItems && assignedItems.length > 0
      ? [
          "- Each review must be about its assigned subject (see user message). Do not swap or substitute subjects",
          "- Do not mention a catalog item in a review other than the one it is assigned to",
        ]
      : [
          "- Treat every listed item as equal weight. A phrase that appears more than once is not more important",
          "- Do not default to the shop's most distinctive or most-mentioned specialty",
        ];

  return [
    "You write three short Google reviews for a real customer who just visited this business.",
    "",
    "Rules:",
    "- Shop notes override every other rule in this prompt when they conflict, including example Google reviews",
    "- First person",
    "- 2–5 sentences each",
    `- Three different angles. Each one says what to pick from shop notes if they list items:\n${angleLines}`,
    "- Do not copy existing Google reviews; they are style/content hints only",
    "- No hashtags",
    '- No "hidden gem" spam',
    "- Do not name staff unless the shop notes include their name",
    `- Write in the tone of a ${starIntent}-star review. Do not set Google stars or fill in the Google form.`,
    "- No exclamation marks — they read as fake",
    "- No filler phrases like 'I highly recommend', 'definitely recommend', 'five stars', 'absolutely', 'amazing', or 'fantastic'",
    "- Vary sentence length. Sound like a real person dashing off a review, not an AI or a marketing writer",
    ...itemRules,
    "",
    "Return JSON only, this shape:",
    `{ "reviews": [ { "id": "a", "angle": "${a.label}", "text": "..." }, { "id": "b", "angle": "${b.label}", "text": "..." }, { "id": "c", "angle": "${c.label}", "text": "..." } ] }`,
  ].join("\n");
}

function userMessage(input: BuildPromptInput): string {
  const { snapshot, customInstructions, assignedItems } = input;
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
    lines.push("", "Shop notes (these override the rules above):", notes);
  }

  // When the server has assigned subjects, list them explicitly.
  // Do NOT also dump the full catalog here — that causes gravitating.
  if (assignedItems && assignedItems.length > 0) {
    lines.push(
      "",
      "Assigned subjects (each review must cover exactly its subject):",
      ...assignedItems.map((it) => `  ${it.id}: ${it.name}`),
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

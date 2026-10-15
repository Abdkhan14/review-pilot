import type { PromptMessage } from "./prompt-builder";

export type HumanizeContext = {
  shopName: string;
  assignedItem?: string;
  starIntent: number;
  voiceInstruction: string;
  lengthInstruction: string;
};

/**
 * Builds the two-message prompt for the humanize editor pass.
 *
 * The system message is a short, review-specific checklist distilled from the
 * humanize skill. It tells the model what to fix (roundabout phrasing, trailing
 * -ing repeats, fronted-adjective openers, generic closers, redundancy,
 * contradictions, metronomic rhythm) and what to preserve (every fact, the shop
 * name, the assigned item, first person, star tone, length limit).
 *
 * The user message is the raw draft text to edit.
 */
export function buildHumanizePrompt(text: string, ctx: HumanizeContext): PromptMessage[] {
  const { shopName, assignedItem, starIntent, voiceInstruction, lengthInstruction } = ctx;

  const itemLine = assignedItem
    ? `- Preserve the assigned item "${assignedItem}" spelled exactly as written.`
    : null;

  const lines: (string | null)[] = [
    "You are a line editor. Fix AI-writing patterns in the review below. If the text already sounds natural and human, return it unchanged.",
    "",
    voiceInstruction,
    lengthInstruction,
    "",
    "Fix when present:",
    `- Roundabout phrasing: "found myself X-ing", "it was X that I", "made me consider", "due to", "in order to".`,
    `- Trailing -ing aside that only restates the previous clause: "..., offering a more generous serving" after saying the portion was bigger.`,
    `- Fronted-adjective opener ("Crispy and well-seasoned, it..."): put the adjectives after the noun.`,
    `- Generic closer ("for a satisfying start", "for a satisfying X"): cut it or replace with something specific.`,
    `- Saying the same thing twice in different words.`,
    `- Contradictions between sentences.`,
    `- All sentences the same length: include at least one short sentence (under 8 words).`,
    "",
    "Preserve:",
    `- Every stated fact.`,
    `- Shop name "${shopName}" spelled exactly as written.`,
    itemLine,
    `- First person, ${starIntent}-star positive tone.`,
    `- No em dashes, no exclamation marks.`,
    `- No new facts, staff names, or prices not already in the text.`,
    `- At most 3 sentences.`,
    "",
    `Return JSON only: { "text": "..." }`,
  ];

  const systemContent = lines.filter((l): l is string => l !== null).join("\n");

  return [
    { role: "system", content: systemContent },
    { role: "user", content: text },
  ];
}

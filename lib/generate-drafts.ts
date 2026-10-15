import "server-only";
import OpenAI from "openai";
import type { PromptMessage } from "./prompt-builder";
import { buildHumanizePrompt, type HumanizeContext } from "./humanize-prompt";

export type DraftReview = { id: string; angle: string; text: string };

export type DraftSlot = { messages: PromptMessage[]; edit: HumanizeContext };

export class GenerationError extends Error {
  constructor(reason: string) {
    super(`Draft generation failed: ${reason}`);
    this.name = "GenerationError";
  }
}

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY env var is not set");
  return new OpenAI({ apiKey: key });
}

function parseDraft(content: string | null | undefined, idx: number): DraftReview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content ?? "");
  } catch {
    throw new GenerationError("model returned non-JSON content");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as DraftReview).id !== "string" ||
    typeof (parsed as DraftReview).angle !== "string" ||
    typeof (parsed as DraftReview).text !== "string"
  ) {
    throw new GenerationError(`draft at index ${idx} missing required fields`);
  }

  return parsed as DraftReview;
}

async function generateOneDraft(messages: PromptMessage[], idx: number): Promise<DraftReview> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-nano",
    messages,
    response_format: { type: "json_object" },
    temperature: 0.9,
    frequency_penalty: 0.5,
    presence_penalty: 0.3,
  });
  const content = completion.choices[0]?.message?.content;
  return parseDraft(content, idx);
}

/**
 * Returns the number of sentences in `text`, detected by sentence-ending
 * punctuation followed by a capital letter or end-of-string. Used to guard
 * against the editor producing an oversized edit.
 */
function countSentences(text: string): number {
  const matches = text.match(/[.!?](?:\s+[A-Z]|$)/g);
  return matches ? matches.length : 1;
}

/**
 * Runs the humanize editor pass on a single draft.
 *
 * Uses OPENAI_EDIT_MODEL if set, otherwise falls back to OPENAI_MODEL, then
 * "gpt-4.1-nano". Temperature is lower than generation (0.4) so the edit is
 * focused and conservative.
 *
 * Falls back to the original draft (rather than failing) when:
 * - DRAFT_EDIT_PASS=off (kill switch)
 * - The edit call throws
 * - The response is non-JSON or has no `text` field
 * - The edited text is empty
 * - The edit exceeds 3 sentences
 * - The original contained the assigned item but the edit dropped it
 */
async function humanizeDraft(draft: DraftReview, ctx: HumanizeContext): Promise<DraftReview> {
  if (process.env.DRAFT_EDIT_PASS === "off") return draft;

  const client = getClient();
  const messages = buildHumanizePrompt(draft.text, ctx);
  const model =
    process.env.OPENAI_EDIT_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4.1-nano";

  let content: string | null | undefined;
  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.4,
    });
    content = completion.choices[0]?.message?.content;
  } catch {
    return draft;
  }

  let editedText: string;
  try {
    const parsed = JSON.parse(content ?? "");
    if (typeof parsed?.text !== "string" || !parsed.text.trim()) return draft;
    editedText = parsed.text.trim();
  } catch {
    return draft;
  }

  // Guard: editor must not expand the review beyond 3 sentences.
  if (countSentences(editedText) > 3) return draft;

  // Guard: if the original mentioned the assigned item, the edit must too.
  if (ctx.assignedItem) {
    const itemLower = ctx.assignedItem.toLowerCase();
    if (
      draft.text.toLowerCase().includes(itemLower) &&
      !editedText.toLowerCase().includes(itemLower)
    ) {
      return draft;
    }
  }

  return { ...draft, text: editedText };
}

/**
 * Generates one draft per slot, running all chains in parallel.
 * Each chain: generate → humanize edit → return.
 * Expects exactly DRAFT_COUNT (3) slots — one per draft id.
 */
export async function generateDrafts(slots: DraftSlot[]): Promise<DraftReview[]> {
  return Promise.all(
    slots.map((slot, i) =>
      generateOneDraft(slot.messages, i).then((draft) => humanizeDraft(draft, slot.edit)),
    ),
  );
}

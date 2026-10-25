import "server-only";
import OpenAI, { NotFoundError } from "openai";
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

// Module-level set of confirmed-dead model IDs so a warm serverless function
// instance doesn't pay for a 404 round trip on every subsequent request.
const deadModels = new Set<string>();

/** @internal exported only for test teardown */
export function _resetDeadModels(): void {
  deadModels.clear();
}

/**
 * Returns the ordered list of models to try for both the generate and edit
 * calls: [OPENAI_MODEL, ...OPENAI_FALLBACK_MODELS]. Defaults to gpt-5.6-luna
 * with a gpt-5.4-mini fallback. Every model in the chain must accept the same
 * request params (temperature, penalties, reasoning_effort "none").
 */
function getModelChain(): string[] {
  const primary = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const fallbacks = (process.env.OPENAI_FALLBACK_MODELS || "gpt-5.4-mini")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return [primary, ...fallbacks];
}

/**
 * Calls client.chat.completions.create, walking the model list on NotFoundError
 * (retired / non-existent model). Other errors are rethrown immediately.
 * Dead models are cached so a warm function skips them without a network call.
 * Throws GenerationError when all models in the chain are exhausted.
 */
async function completeWithFallback(
  client: OpenAI,
  params: Omit<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, "model">,
  models: string[],
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const remaining = models.filter((m) => !deadModels.has(m));

  for (let i = 0; i < remaining.length; i++) {
    const model = remaining[i];
    try {
      return await client.chat.completions.create({ ...params, model });
    } catch (err) {
      if (err instanceof NotFoundError) {
        deadModels.add(model);
        const next = remaining[i + 1];
        if (next) {
          console.error(`[openai] model ${model} unavailable, falling back to ${next}`);
        } else {
          console.error(`[openai] model ${model} unavailable, no more fallbacks`);
        }
        // continue to next model in loop
      } else {
        throw err;
      }
    }
  }

  throw new GenerationError("all models in fallback chain are unavailable");
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
  const completion = await completeWithFallback(
    client,
    {
      messages,
      response_format: { type: "json_object" },
      temperature: 0.9,
      frequency_penalty: 0.5,
      presence_penalty: 0.3,
      reasoning_effort: "none",
    },
    getModelChain(),
  );
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
 * Uses the same model chain as generation. Temperature is lower than
 * generation (0.4) so the edit is focused and conservative.
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

  const debug = process.env.DRAFT_EDIT_DEBUG === "1";

  const client = getClient();
  const messages = buildHumanizePrompt(draft.text, ctx);

  let content: string | null | undefined;
  try {
    const completion = await completeWithFallback(
      client,
      {
        messages,
        response_format: { type: "json_object" },
        temperature: 0.4,
        reasoning_effort: "none",
      },
      getModelChain(),
    );
    content = completion.choices[0]?.message?.content;
  } catch (err) {
    if (debug) console.info(`[humanize] id=${draft.id} fallback=api-error error=${String(err)}`);
    return draft;
  }

  let editedText: string;
  let issues: unknown[] = [];
  try {
    const parsed = JSON.parse(content ?? "");
    if (typeof parsed?.text !== "string" || !parsed.text.trim()) {
      if (debug) console.info(`[humanize] id=${draft.id} fallback=empty-text raw=${String(content)}`);
      return draft;
    }
    editedText = parsed.text.trim();
    if (Array.isArray(parsed.issues)) issues = parsed.issues;
  } catch {
    if (debug) console.info(`[humanize] id=${draft.id} fallback=non-json raw=${String(content)}`);
    return draft;
  }

  // Guard: editor must not expand the review beyond 3 sentences.
  if (countSentences(editedText) > 3) {
    if (debug) console.info(`[humanize] id=${draft.id} fallback=sent-over-limit edit="${editedText}"`);
    return draft;
  }

  // Guard: if the original mentioned the assigned item, the edit must too.
  if (ctx.assignedItem) {
    const itemLower = ctx.assignedItem.toLowerCase();
    if (
      draft.text.toLowerCase().includes(itemLower) &&
      !editedText.toLowerCase().includes(itemLower)
    ) {
      if (debug) console.info(`[humanize] id=${draft.id} fallback=dropped-item item="${ctx.assignedItem}" edit="${editedText}"`);
      return draft;
    }
  }

  if (debug) {
    console.info(
      `[humanize] id=${draft.id} issues=${JSON.stringify(issues)} original="${draft.text}" edit="${editedText}"`,
    );
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

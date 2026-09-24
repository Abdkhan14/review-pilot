import "server-only";
import OpenAI from "openai";
import type { PromptMessage } from "./prompt-builder";

export type DraftReview = { id: string; angle: string; text: string };

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
 * Generates one draft per messages array, running all calls in parallel.
 * Expects exactly DRAFT_COUNT (3) message arrays — one per draft slot.
 */
export async function generateDrafts(messagesList: PromptMessage[][]): Promise<DraftReview[]> {
  return Promise.all(messagesList.map((messages, i) => generateOneDraft(messages, i)));
}

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

function parseDrafts(content: string | null | undefined): DraftReview[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content ?? "");
  } catch {
    throw new GenerationError("model returned non-JSON content");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as { reviews?: unknown }).reviews)
  ) {
    throw new GenerationError("model JSON missing reviews array");
  }

  const reviews = (parsed as { reviews: unknown[] }).reviews;

  if (reviews.length < 3) {
    throw new GenerationError(
      `expected 3 reviews, got ${reviews.length}`,
    );
  }

  return reviews.slice(0, 3).map((r, i) => {
    if (
      !r ||
      typeof r !== "object" ||
      typeof (r as DraftReview).id !== "string" ||
      typeof (r as DraftReview).angle !== "string" ||
      typeof (r as DraftReview).text !== "string"
    ) {
      throw new GenerationError(`review at index ${i} missing required fields`);
    }
    return r as DraftReview;
  });
}

export async function generateDrafts(
  messages: PromptMessage[],
): Promise<DraftReview[]> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-nano",
    messages,
    response_format: { type: "json_object" },
    temperature: 0.9,
  });

  const content = completion.choices[0]?.message?.content;
  return parseDrafts(content);
}

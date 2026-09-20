import type { CreateBusinessInput } from "./business-repo";

export type ParseResult =
  | { ok: true; input: CreateBusinessInput }
  | { ok: false; error: string };

/**
 * Validates and normalises a raw JSON body into CreateBusinessInput.
 * Slug is intentionally excluded — the server always generates it.
 */
export function parseCreateBusinessInput(body: unknown): ParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "body must be a JSON object" };
  }

  const raw = body as Record<string, unknown>;
  const { name, placeId, tier, customInstructions } = raw;

  if (typeof name !== "string" || name.trim() === "") {
    return { ok: false, error: "name is required and must be a non-empty string" };
  }
  if (typeof placeId !== "string" || placeId.trim() === "") {
    return { ok: false, error: "placeId is required and must be a non-empty string" };
  }
  if (tier !== "BASIC" && tier !== "SAAS") {
    return { ok: false, error: 'tier must be "BASIC" or "SAAS"' };
  }

  const input: CreateBusinessInput = {
    name: name.trim(),
    placeId: placeId.trim(),
    tier,
  };

  if (typeof customInstructions === "string" && customInstructions.trim() !== "") {
    input.customInstructions = customInstructions.trim();
  }

  return { ok: true, input };
}

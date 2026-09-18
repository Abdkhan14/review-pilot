import type { UpdateBusinessInput } from "./business-repo";

export type UpdateParseResult =
  | { ok: true; input: UpdateBusinessInput }
  | { ok: false; error: string };

/**
 * Validates a raw JSON body into UpdateBusinessInput.
 * Only tier and customInstructions are accepted — name, slug, placeId are
 * intentionally dropped even if the client sends them.
 */
export function parseUpdateBusinessInput(body: unknown): UpdateParseResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "body must be a JSON object" };
  }

  const raw = body as Record<string, unknown>;
  const { tier, customInstructions } = raw;

  if (tier !== "BASIC" && tier !== "SAAS") {
    return { ok: false, error: 'tier must be "BASIC" or "SAAS"' };
  }

  const input: UpdateBusinessInput = { tier };

  if (typeof customInstructions === "string") {
    // empty string → clear the field
    input.customInstructions =
      customInstructions.trim() === "" ? null : customInstructions.trim();
  } else if (customInstructions === null) {
    input.customInstructions = null;
  }
  // undefined → leave field unchanged (omit from update)

  return { ok: true, input };
}

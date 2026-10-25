/**
 * check-models.ts
 *
 * Verifies that every OpenAI model configured in env vars exists on the API
 * and has no shutdown date within the next 60 days. Run it with
 * `npm run check-models` to get advance warning before a deprecation causes
 * a production outage.
 *
 * Reads:
 *   OPENAI_API_KEY        (required)
 *   OPENAI_MODEL           model for generation and edit (default: gpt-5.6-luna)
 *   OPENAI_FALLBACK_MODELS comma-separated chain         (default: gpt-5.4-mini)
 *
 * Exit codes:
 *   0 — all models are available and have no near-term shutdown
 *   1 — one or more models are missing or retiring within 60 days
 */

import OpenAI, { NotFoundError } from "openai";

const WARN_DAYS = 60;

function msUntil(dateStr: string): number {
  return new Date(dateStr).getTime() - Date.now();
}

function daysUntil(dateStr: string): number {
  return Math.ceil(msUntil(dateStr) / (1000 * 60 * 60 * 24));
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: OPENAI_API_KEY is not set.");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });

  // `||` (not `??`) so empty values like `OPENAI_MODEL=` use the defaults.
  const primary = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const fallbacks = (process.env.OPENAI_FALLBACK_MODELS || "gpt-5.4-mini")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const allModels = [...new Set([primary, ...fallbacks])];

  console.log(`Checking ${allModels.length} model(s): ${allModels.join(", ")}\n`);

  let hasError = false;

  for (const modelId of allModels) {
    try {
      const model = await client.models.retrieve(modelId);
      const sd = model.shutdown_date;
      if (sd) {
        const days = daysUntil(sd);
        if (days <= WARN_DAYS) {
          console.error(
            `ERROR: ${modelId} shuts down on ${sd} (in ${days} day${days === 1 ? "" : "s"}). Update OPENAI_MODEL / OPENAI_FALLBACK_MODELS now.`,
          );
          hasError = true;
        } else {
          console.log(`  OK  ${modelId}  (shuts down ${sd}, ${days} days away)`);
        }
      } else {
        console.log(`  OK  ${modelId}  (no shutdown date announced)`);
      }
    } catch (err) {
      if (err instanceof NotFoundError) {
        console.error(`ERROR: ${modelId} returned 404 — model does not exist or has already been retired.`);
      } else {
        console.error(`ERROR: ${modelId} — unexpected error: ${String(err)}`);
      }
      hasError = true;
    }
  }

  if (hasError) {
    console.error("\nOne or more models need to be replaced. See https://platform.openai.com/docs/deprecations");
    process.exit(1);
  }

  console.log("\nAll models are available and have no near-term shutdown date.");
}

main();

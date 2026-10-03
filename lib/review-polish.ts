import nlp from "compromise";
import { stripAdjectives } from "./review-adjectives";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * AI-tell adverbs that make prose sound generated. Intentionally short so
 * timing words (`quickly`) and sensory words (`warmly`) survive — they are
 * legitimately useful in the timing and temperature voice recipes.
 */
const DENYLISTED_ADVERBS = new Set([
  "seamlessly",
  "effortlessly",
  "perfectly",
  "beautifully",
  "wonderfully",
]);

/**
 * Banned closer phrases. When a sentence contains any of these the whole
 * sentence is dropped — not just the phrase — because phrase-level deletion
 * leaves surrounding words orphaned and ungrammatical:
 *   "I highly recommend the shawarma." → phrase delete → "I the shawarma."
 *
 * Taken verbatim from the system prompt in lib/prompt-builder.ts so the
 * post-pass enforces what the model was already told.
 */
const BANNED_CLOSERS = [
  "highly recommend",
  "definitely recommend",
  "hidden gem",
  "must try",
  "will be back",
  "exceeded expectations",
  "from start to finish",
  "overall experience",
  "worth noting",
  "five stars",
  "10/10",
] as const;

// ─── Passes ───────────────────────────────────────────────────────────────────

/**
 * Pass 1 — punctuation normalisation (string replace, no POS needed).
 * - `!`  → `.`   (prompt bans exclamation marks)
 * - `—`  → `,`   (prompt bans em dashes)
 * Cleans up any space-before-comma and duplicate periods introduced by the
 * replacements.
 */
function normalisePunctuation(text: string): string {
  return text
    .replace(/!/g, ".")
    .replace(/—/g, ",")
    .replace(/\s+,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\.{2,}/g, ".")
    .trim();
}

/**
 * Pass 2 — drop sentences that contain a banned closer phrase.
 * Only drops when at least one other sentence would remain so the result is
 * never empty. A single-sentence review that happens to be a closer is left
 * intact — deleting it would leave nothing to show the customer.
 */
function dropCloserSentences(text: string): string {
  const sentences = (nlp(text).sentences().out("array") as string[]).filter(
    (s) => s.trim().length > 0,
  );
  if (sentences.length <= 1) return text;

  const kept = sentences.filter(
    (s) => !BANNED_CLOSERS.some((phrase) => nlp(s).has(phrase)),
  );

  // If every sentence contained a closer, keep them all rather than returning "".
  return kept.length > 0 ? kept.join(" ") : text;
}

/**
 * Pass 3 — per-sentence contractions.
 * Document-level `.contract()` on multi-sentence text is unreliable (glues
 * tokens, drops auxiliary words). Running it sentence-by-sentence is stable:
 *   "I am glad." → "I'm glad."   "Do not wait." → "Don't wait."
 * Possessives like "Joe's Pizza" are unaffected because compromise
 * distinguishes them from verb contractions.
 *
 * Runs after closer-sentence drop so "will be back" is still in its expanded
 * form and can be matched above.
 */
function contractSentences(text: string): string {
  return (nlp(text).sentences().out("array") as string[])
    .map((s: string) => nlp(s).contract().text())
    .join(" ")
    .trim();
}

/**
 * Pass 4 — remove hashtags.
 * "#bestpizza the crust was good" → "the crust was good"
 *
 * Uses `doc.delete(tags)` — passing the hashtag View as a `Matchable` argument
 * satisfies the typed signature while removing the same terms at runtime.
 */
function removeHashtags(text: string): string {
  const doc = nlp(text);
  const tags = doc.hashTags();
  tags.delete(tags);
  return doc.text().trim();
}

/**
 * Pass 5 — delete denylisted -ly adverbs.
 * Only the fixed list above is removed. Generic timing/sensory adverbs
 * (`quickly`, `slowly`, `warmly`) that voice recipes may generate are kept.
 *
 * Avoids `adverbs().forEach` because the callback only receives a base `View`.
 * Instead, adverbs are extracted as strings via `.out("array")` and each
 * denylisted word is deleted from the document with `doc.delete(pattern)`.
 */
function removeDenylistedAdverbs(text: string): string {
  const doc = nlp(text);
  const adverbs = doc.adverbs().out("array") as string[];

  for (const word of adverbs) {
    if (DENYLISTED_ADVERBS.has(word.toLowerCase())) {
      doc.delete(`(${word} && #Adverb)`);
    }
  }

  return doc
    .text()
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Applies all AI-tell polish passes to a draft review text, in order:
 *
 * 1. Strip intensifier adverbs and stacked adjective pairs (`stripAdjectives`).
 * 2. Normalise exclamation marks to periods and em dashes to commas.
 * 3. Drop full sentences that contain a banned closer phrase (when at least
 *    one other sentence would remain).
 * 4. Contract expanded verb forms per sentence (`I am` → `I'm`).
 * 5. Delete hashtags.
 * 6. Delete denylisted -ly adverbs (`seamlessly`, `perfectly`, etc.).
 *
 * Protected words (shop name, catalog item) survive all passes.
 * Each pass falls back to its input if it would produce an empty string.
 *
 * Must be called before `applyTexture` / `applyTypo` so grammar slips
 * introduced by the texture pass are not retagged or normalised.
 */
export function polishDraft(text: string, protected_: string[] = []): string {
  const safe = (result: string, fallback: string): string =>
    result.trim() ? result : fallback;

  let out = stripAdjectives(text, protected_);
  out = safe(normalisePunctuation(out), out);
  out = safe(dropCloserSentences(out), out);
  out = safe(contractSentences(out), out);
  out = safe(removeHashtags(out), out);
  out = safe(removeDenylistedAdverbs(out), out);

  return out;
}

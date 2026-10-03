import nlp from "compromise";
import { stripAdjectives } from "./review-adjectives";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of a term object returned by compromise's `.json()`. */
interface JsonTerm {
  text: string;
  tags: string[];
}

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
 * Mirrors the system prompt in lib/prompt-builder.ts so the post-pass
 * enforces what the model was already told.
 */
const BANNED_CLOSERS = [
  // Original set
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
  // Gratitude / abstract-closer phrases
  "by the way",
  "worth trying",
  "this area",
  "if you're in the area",
  "it's rare to find",
  "attention to detail",
  "welcoming atmosphere",
  "made all the difference",
  "leave an impression",
  "leaves an impression",
  "feel confident",
  // Observer frames — model uses these despite the prompt ban
  "I noticed",
  "overall",
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
 * Pass 1.5 — strip mid-sentence colon item descriptions.
 *
 * The model sometimes uses a colon to summarise what a menu item is, which
 * reads like a menu card, not a personal experience:
 *   "the classic poutine: fries with gravy and cheese curds did not disappoint"
 *   → "the classic poutine did not disappoint"
 *
 * Detection: `: ` followed by a lowercase word (mid-sentence only — colons
 * starting a new capitalised clause are left untouched).
 * Mechanism: parse what follows the colon with compromise, find the first
 * finite verb (PastTense or PresentTense, not Gerund/Participle), remove
 * everything between the colon and that verb. If no finite verb is found the
 * text is left unchanged (safe fallback).
 */
function removeInlineColonDescriptions(text: string): string {
  return text.replace(/:\s+([a-z][^.!?]*)/g, (fullMatch, afterColon) => {
    const terms = (nlp(afterColon).json()[0]?.terms ?? []) as JsonTerm[];
    const verbIdx = terms.findIndex(
      (t) =>
        (t.tags.includes("PastTense") || t.tags.includes("PresentTense")) &&
        !t.tags.includes("Gerund") &&
        !t.tags.includes("Participle"),
    );
    if (verbIdx <= 0) return fullMatch; // no safe split — leave unchanged
    const rest = terms
      .slice(verbIdx)
      .map((t) => t.text)
      .join(" ");
    return " " + rest;
  });
}

/**
 * Splits text into sentences by cutting on whitespace that follows a period.
 *
 * Uses a string regex rather than compromise's `.sentences().out("array")` to
 * preserve original casing — compromise's `.out()` can recapitalize the first
 * word of each sentence, which would undo texture slips like a lowercase start
 * introduced by `applyTexture` before this pass (when called out of order) or
 * a lowercase opener the model itself wrote.
 */
function splitOnPeriods(text: string): string[] {
  return text.split(/(?<=\.)\s+/).filter((s) => s.trim().length > 0);
}

/**
 * Pass 2 — drop sentences that contain a banned closer phrase.
 * Only drops when at least one other sentence would remain so the result is
 * never empty. A single-sentence review that happens to be a closer is left
 * intact — deleting it would leave nothing to show the customer.
 *
 * Splitting is done on the original string (not via compromise's normalizer)
 * so that texture-introduced lowercase starts survive unchanged.
 */
function dropCloserSentences(text: string): string {
  const sentences = splitOnPeriods(text);
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
 * Uses `splitOnPeriods` (not compromise's sentence splitter) so texture-slip
 * lowercase starts are not recapitalized by compromise's normalizer.
 *
 * Runs after closer-sentence drop so "will be back" is still in its expanded
 * form and can be matched above.
 */
function contractSentences(text: string): string {
  return splitOnPeriods(text)
    .map((s) => nlp(s).contract().text())
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
 * 1. Strip intensifier adverbs and stacked adjective/noun pairs (`stripAdjectives`).
 * 2. Normalise exclamation marks to periods and em dashes to commas.
 * 2.5. Strip mid-sentence colon item descriptions (`poutine: fries with…` → `poutine`).
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
  out = safe(removeInlineColonDescriptions(out), out);
  out = safe(dropCloserSentences(out), out);
  out = safe(contractSentences(out), out);
  out = safe(removeHashtags(out), out);
  out = safe(removeDenylistedAdverbs(out), out);

  return out;
}

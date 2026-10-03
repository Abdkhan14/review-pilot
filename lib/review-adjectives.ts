import nlp from "compromise";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of a term object returned by compromise's `.json()`. */
interface JsonTerm {
  text: string;
  /** Trailing punctuation / whitespace attached to this token (e.g. ", "). */
  post: string;
  /** Part-of-speech tags in serialised (array) form. */
  tags: string[];
}

/**
 * The document type returned by `nlp()`. Using ReturnType avoids importing
 * the internal `Three` interface directly from the package.
 */
type NlpDoc = ReturnType<typeof nlp>;

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Intensifier adverbs that inflate praise without adding meaning.
 * These are stripped before the POS-based adjective passes so compromise
 * never has a chance to re-tag them as something else.
 */
const INTENSIFIERS = [
  "absolutely",
  "really",
  "very",
  "incredibly",
  "truly",
  "extremely",
] as const;

const INTENSIFIER_RE = new RegExp(
  `\\b(${INTENSIFIERS.join("|")})\\b\\s*`,
  "gi",
);

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Builds a set of lowercase words extracted from protected phrases (shop name,
 * catalog item). Words shorter than 3 characters are excluded — they are too
 * common to use as guards (e.g. "of", "a").
 */
function buildGuard(phrases: string[]): Set<string> {
  const words = new Set<string>();
  for (const phrase of phrases) {
    for (const word of phrase.toLowerCase().split(/\W+/)) {
      if (word.length >= 3) words.add(word);
    }
  }
  return words;
}

function isGuarded(word: string, guard: Set<string>): boolean {
  return guard.has(word.toLowerCase());
}

/** Returns the last whitespace-separated token from a match's text. */
function lastWord(matchText: string): string {
  const parts = matchText.trim().split(/\s+/);
  return parts[parts.length - 1];
}

// ─── Passes ───────────────────────────────────────────────────────────────────

/**
 * Pass 1 — intensifiers.
 * Pure regex; no tagging required and no risk of POS misfires.
 * "absolutely delicious" → "delicious"
 */
function removeIntensifiers(text: string, guard: Set<string>): string {
  return text
    .replace(INTENSIFIER_RE, (match, word: string) =>
      isGuarded(word, guard) ? match : "",
    )
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

/**
 * Pass 2a — `adj and adj` pairs.
 * "tender and juicy" → "juicy"
 *
 * The forEach callback is intentionally unannotated so TypeScript infers the
 * base `View` type expected by compromise's `.forEach` signature — annotating
 * it with the full document type (NlpDoc) causes a TS2345 mismatch.
 */
function collapseAndPairs(doc: NlpDoc, guard: Set<string>): void {
  doc.match("#Adjective and #Adjective").forEach((m) => {
    const second = lastWord(m.text());
    if (!isGuarded(second, guard)) {
      m.replaceWith(second);
    }
  });
}

/**
 * Pass 2b — `adj, adj` pairs.
 *
 * compromise stores commas in a term's `post` field rather than as a separate
 * token, so the pattern `"#Adjective , #Adjective"` never matches. Instead,
 * we scan the JSON term list directly: an adjective whose `post` contains a
 * comma and whose next sibling is also an adjective is the first of a stacked
 * pair. Collecting before deleting handles chains of three or more
 * (e.g. "warm, crusty, golden" → "warm" and "crusty" are both collected,
 * leaving "golden").
 *
 * Deletion uses `doc.delete(pattern)` — the typed form of removing terms
 * matching a string pattern from the document.
 *
 * "rich, flavorful sauce" → "flavorful sauce"
 */
function collapseCommaPairs(doc: NlpDoc, guard: Set<string>): void {
  const toDelete: string[] = [];

  for (const sentence of doc.json() as { terms: JsonTerm[] }[]) {
    const terms = sentence.terms;
    for (let i = 0; i < terms.length - 1; i++) {
      const cur = terms[i];
      const next = terms[i + 1];
      const curIsAdj =
        Array.isArray(cur.tags) && cur.tags.includes("Adjective");
      const nextIsAdj =
        Array.isArray(next.tags) && next.tags.includes("Adjective");

      if (
        curIsAdj &&
        cur.post.includes(",") &&
        nextIsAdj &&
        !isGuarded(cur.text, guard)
      ) {
        toDelete.push(cur.text);
      }
    }
  }

  for (const word of toDelete) {
    // The `&&` syntax requires both the literal word AND the Adjective tag,
    // preventing accidental deletion of the same word used as a different POS.
    // doc.delete(pattern) is the typed equivalent of the selection's no-arg .delete().
    doc.delete(`(${word} && #Adjective)`);
  }
}

/**
 * Pass 3 — noun-phrase cap.
 * For each noun phrase that has 2+ consecutive (non-comma-separated)
 * adjectives, keep only the last one.
 * "warm crusty bread" → "crusty bread"
 *
 * Avoids `nouns().forEach` because the callback only receives a base `View`,
 * which does not expose `.adjectives()`. Instead, noun phrases are extracted
 * as strings via `.out("array")` and re-parsed in isolation to read their
 * adjectives.
 */
function capNounAdjectives(doc: NlpDoc, guard: Set<string>): void {
  const nounPhrases = doc.nouns().out("array") as string[];

  for (const phrase of nounPhrases) {
    const adjArr = nlp(phrase).adjectives().out("array") as string[];
    if (adjArr.length <= 1) continue;

    const toDrop = adjArr.slice(0, -1); // all but the rightmost adjective
    // If any adjective being dropped is a protected word, leave the whole
    // phrase intact rather than risk mangling the shop name or catalog item.
    if (toDrop.some((w) => isGuarded(w, guard))) continue;

    for (const word of toDrop) {
      doc.delete(`(${word} && #Adjective)`);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Strips AI-tell adjective patterns from a draft review text:
 *
 * 1. Removes intensifier adverbs (`absolutely`, `really`, `very`, etc.).
 * 2. Collapses `adj and adj` pairs to the second adjective.
 * 3. Collapses `adj, adj` pairs to the second adjective.
 * 4. Caps each noun phrase to one adjective (keeps the last / closest to noun).
 *
 * Protected words (derived from `protected_` — typically the shop name and the
 * assigned catalog item) are never touched. Returns the original `text`
 * unchanged if all passes would produce an empty string.
 *
 * Must be called **before** `applyTexture` / `applyTypo` so that grammar slips
 * introduced by the texture pass are not retagged and "corrected" by
 * compromise's normaliser.
 */
export function stripAdjectives(
  text: string,
  protected_: string[] = [],
): string {
  const guard = buildGuard(protected_);

  // Pass 1: intensifiers — pure regex, fast, zero tagging risk.
  const cleaned = removeIntensifiers(text, guard);
  if (!cleaned) return text;

  // Passes 2 & 3: POS-based — run on the post-intensifier string.
  const doc = nlp(cleaned);
  collapseAndPairs(doc, guard);
  collapseCommaPairs(doc, guard);
  capNounAdjectives(doc, guard);

  const out = doc
    .text()
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

  // Safety: never return empty — if something went wrong, keep the original.
  return out || text;
}

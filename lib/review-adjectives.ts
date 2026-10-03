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

/** Alias for the type returned by `nlp()` and all view operations. */
type NlpView = ReturnType<typeof nlp>;

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
 */
function collapseAndPairs(doc: NlpView, guard: Set<string>): void {
  doc.match("#Adjective and #Adjective").forEach((m: NlpView) => {
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
 * "rich, flavorful sauce" → "flavorful sauce"
 */
function collapseCommaPairs(doc: NlpView, guard: Set<string>): void {
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
    doc.match(`(${word} && #Adjective)`).delete();
  }
}

/**
 * Pass 3 — noun-phrase cap.
 * For each noun phrase whose adjectives have no commas between them (those are
 * handled in pass 2b), keep only the last adjective.
 * "warm crusty bread" → "crusty bread"
 */
function capNounAdjectives(doc: NlpView, guard: Set<string>): void {
  doc.nouns().forEach((noun: NlpView) => {
    const adjArr = noun.adjectives().out("array") as string[];
    if (adjArr.length <= 1) return;

    const toDrop = adjArr.slice(0, -1); // all but the rightmost adjective
    // If any adjective being dropped is a protected word, leave the whole
    // phrase intact rather than risk mangling the shop name or catalog item.
    if (toDrop.some((w: string) => isGuarded(w, guard))) return;

    for (const word of toDrop) {
      doc.match(`(${word} && #Adjective)`).delete();
    }
  });
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

type Rng = () => number;

// ─── Contraction pairs (for apostrophe_contraction slip) ──────────────────────

const CONTRACTION_PAIRS: [RegExp, string][] = [
  [/\bwouldn't\b/g, "wouldnt"],
  [/\bcouldn't\b/g, "couldnt"],
  [/\bshouldn't\b/g, "shouldnt"],
  [/\bdidn't\b/g, "didnt"],
  [/\bwasn't\b/g, "wasnt"],
  [/\baren't\b/g, "arent"],
  [/\bdon't\b/g, "dont"],
  [/\bthat's\b/g, "thats"],
  [/\bcan't\b/g, "cant"],
  [/\bI'm\b/g, "Im"],
  [/\bit's\b/g, "its"],
];

// ─── Individual slip functions ────────────────────────────────────────────────

function apostropheContraction(text: string, rng: Rng): string {
  type Match = { start: number; length: number; replacement: string };
  const candidates: Match[] = [];
  for (const [pattern, replacement] of CONTRACTION_PAIRS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      if (m.index === 0) continue; // protect position-0 word
      candidates.push({ start: m.index, length: m[0].length, replacement });
    }
  }
  if (candidates.length === 0) return text;
  const chosen = candidates[Math.floor(rng() * candidates.length)];
  return text.slice(0, chosen.start) + chosen.replacement + text.slice(chosen.start + chosen.length);
}

function droppedFinalPeriod(text: string): string {
  const trimmed = text.trimEnd();
  return trimmed.endsWith(".") ? trimmed.slice(0, -1) : text;
}

function commaSplice(text: string): string {
  const trimmed = text.trimEnd();
  if (!trimmed.endsWith(".")) return text;
  const lastPeriod = trimmed.lastIndexOf(".", trimmed.length - 2);
  if (lastPeriod === -1) return droppedFinalPeriod(text);
  const before = trimmed.slice(0, lastPeriod);
  const after = trimmed.slice(lastPeriod + 1).trimStart();
  if (after.length === 0) return droppedFinalPeriod(text);
  return before + ", " + after[0].toLowerCase() + after.slice(1);
}

function lowercaseI(text: string, rng: Rng): string {
  // Find all standalone " I " (not at position 0) including before punctuation
  const pattern = /(?<=\s)I(?=[\s,.'"])/g;
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > 0) matches.push(m);
  }
  if (matches.length === 0) return text;
  const chosen = matches[Math.floor(rng() * matches.length)];
  return text.slice(0, chosen.index) + "i" + text.slice(chosen.index + 1);
}

function alot(text: string): string {
  return text.replace(/\ba lot\b/, "alot");
}

function skipThe(text: string, rng: Rng): string {
  // Find all " the " that are not at the beginning
  const pattern = /\bthe /g;
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > 0) matches.push(m);
  }
  if (matches.length === 0) return text;
  const chosen = matches[Math.floor(rng() * matches.length)];
  return text.slice(0, chosen.index) + text.slice(chosen.index + 4); // remove "the "
}

function noCapSentence2(text: string): string {
  // Find the first ". " and lowercase the letter that follows
  const match = /\.\s+([A-Z])/.exec(text);
  if (!match || match.index === undefined) return text;
  const idx = match.index + match[0].length - 1; // position of the capital letter
  return text.slice(0, idx) + text[idx].toLowerCase() + text.slice(idx + 1);
}

function tho(text: string): string {
  // Replace first "though" (case-insensitive preserving case of first char)
  return text.replace(/\bthough\b/, (m) => (m[0] === "T" ? "Tho" : "tho"));
}

function ok(text: string): string {
  return text.replace(/\bokay\b/, (m) => (m[0] === "O" ? "Ok" : "ok"));
}

function gonna(text: string): string {
  return text.replace(/\bgoing to\b/, "gonna");
}

function wanna(text: string): string {
  return text.replace(/\bwant to\b/, "wanna");
}

function possessiveStrip(text: string, rng: Rng): string {
  // Match possessives like "shop's" "staff's" but not contractions or leading words
  const pattern = /\b(\w{2,})'s\b/g;
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > 0) matches.push(m);
  }
  if (matches.length === 0) return text;
  const chosen = matches[Math.floor(rng() * matches.length)];
  // Strip the apostrophe: word's → words
  const replacement = chosen[1] + "s";
  return text.slice(0, chosen.index) + replacement + text.slice(chosen.index + chosen[0].length);
}

function doubleSpace(text: string, rng: Rng): string {
  // Find spaces between words (not at the start or end) and double one
  const pattern = /(?<=\S) (?=\S)/g;
  const matches: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > 5 && m.index < text.length - 5) matches.push(m.index);
  }
  if (matches.length === 0) return text;
  const idx = matches[Math.floor(rng() * matches.length)];
  return text.slice(0, idx) + "  " + text.slice(idx + 1);
}

function missingComma(text: string, rng: Rng): string {
  // Remove comma from ", and" or ", but"
  const pattern = /, (and|but)\b/g;
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    matches.push(m);
  }
  if (matches.length === 0) return text;
  const chosen = matches[Math.floor(rng() * matches.length)];
  return text.slice(0, chosen.index) + " " + chosen[1] + text.slice(chosen.index + chosen[0].length);
}

function noCapAfterPeriod(text: string, rng: Rng): string {
  // Find all internal ". Capital" and lowercase one
  const pattern = /\.\s+([A-Z])/g;
  const matches: { index: number; capIdx: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    // capIdx is where the capital letter sits
    const capIdx = m.index + m[0].length - 1;
    if (m.index > 0) matches.push({ index: m.index, capIdx });
  }
  if (matches.length === 0) return text;
  const chosen = matches[Math.floor(rng() * matches.length)];
  return text.slice(0, chosen.capIdx) + text[chosen.capIdx].toLowerCase() + text.slice(chosen.capIdx + 1);
}

function kinda(text: string): string {
  return text.replace(/\bkind of\b/, "kinda");
}

function sorta(text: string): string {
  return text.replace(/\bsort of\b/, "sorta");
}

function itsConfusion(text: string): string {
  // Replace first it's with its (apostrophe drop is the common phone slip)
  return text.replace(/\bit's\b/, "its");
}

function runOnMid(text: string, rng: Rng): string {
  // Find all internal ". Capital" (not the last one) and join one
  const pattern = /\.\s+([A-Z])/g;
  const matches: { index: number; fullLen: number; cap: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    matches.push({ index: m.index, fullLen: m[0].length, cap: m[1] });
  }
  // Need at least 2 matches so there is an internal one (last match is the final sentence)
  if (matches.length < 2) return text;
  // Only pick from non-last matches
  const candidates = matches.slice(0, -1);
  const chosen = candidates[Math.floor(rng() * candidates.length)];
  // Replace ". X" with " x" (lowercase)
  return (
    text.slice(0, chosen.index) +
    " " +
    chosen.cap.toLowerCase() +
    text.slice(chosen.index + chosen.fullLen)
  );
}

function lowercaseSentence(text: string, rng: Rng): string {
  // Same as noCapAfterPeriod but picks any internal sentence start
  return noCapAfterPeriod(text, rng);
}

function extraAnd(text: string, rng: Rng): string {
  // Find all internal ". Capital" and replace one with " and lowercase"
  const pattern = /\.\s+([A-Z])/g;
  const matches: { index: number; fullLen: number; cap: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > 0) matches.push({ index: m.index, fullLen: m[0].length, cap: m[1] });
  }
  if (matches.length < 2) return text;
  const candidates = matches.slice(0, -1);
  const chosen = candidates[Math.floor(rng() * candidates.length)];
  return (
    text.slice(0, chosen.index) +
    " and " +
    chosen.cap.toLowerCase() +
    text.slice(chosen.index + chosen.fullLen)
  );
}

// ─── Dispatch map ─────────────────────────────────────────────────────────────

type SlipFn = (text: string, rng: Rng) => string;

const SLIP_MAP: Map<string, SlipFn> = new Map([
  ["apostrophe_contraction", apostropheContraction],
  ["dropped_final_period",   (t) => droppedFinalPeriod(t)],
  ["comma_splice",           (t) => commaSplice(t)],
  ["lowercase_i",            lowercaseI],
  ["alot",                   (t) => alot(t)],
  ["skip_the",               skipThe],
  ["no_cap_sentence2",       (t) => noCapSentence2(t)],
  ["tho",                    (t) => tho(t)],
  ["ok",                     (t) => ok(t)],
  ["gonna",                  (t) => gonna(t)],
  ["wanna",                  (t) => wanna(t)],
  ["possessive_strip",       possessiveStrip],
  ["double_space",           doubleSpace],
  ["missing_comma",          missingComma],
  ["no_cap_after_period",    noCapAfterPeriod],
  ["kinda",                  (t) => kinda(t)],
  ["sorta",                  (t) => sorta(t)],
  ["its_confusion",          (t) => itsConfusion(t)],
  ["run_on_mid",             runOnMid],
  ["missing_period_mid",     runOnMid],  // alias
  ["lowercase_sentence",     lowercaseSentence],
  ["extra_and",              extraAnd],
]);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Applies at most one surface-level imperfection to a review text.
 *
 * - "clean" returns the text unchanged.
 * - Any id from textures.json dispatches to its slip function.
 * - If the chosen slip cannot apply (pattern not found), returns text unchanged.
 *
 * Never touches position 0. Never stacks multiple slips.
 * Called on at most one of the three drafts per generation.
 */
export function applyTexture(text: string, texture: string, rng: Rng = Math.random): string {
  if (texture === "clean") return text;
  const fn = SLIP_MAP.get(texture);
  if (!fn) return text;
  return fn(text, rng);
}

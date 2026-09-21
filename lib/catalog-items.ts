/**
 * Parses and samples catalog items from customInstructions.
 *
 * Format:
 *   Optional prose lines (override guidance for the model).
 *
 *   # Group heading
 *   - Item A
 *   - Item B
 *
 * Items are lines starting with "- ", "* ", or "• ".
 * Group headings are markdown-style "#" lines.
 * Everything else is prose and is left untouched for the model.
 */

/** Number of review drafts generated per request. All sizing in this module uses this constant. */
export const DRAFT_COUNT = 3;

export type CatalogGroup = { label: string; items: string[] };

export type Catalog = {
  /** Non-item lines joined together — the override guidance prose. */
  prose: string;
  /** Item groups; if the notes have no "#" headings all items share a single unnamed group. */
  groups: CatalogGroup[];
};

/** Parse raw customInstructions into prose + grouped items. */
export function parseCatalog(notes: string): Catalog {
  const lines = notes.split("\n");

  const proseLines: string[] = [];
  const groups: CatalogGroup[] = [];
  let currentGroup: CatalogGroup | null = null;

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Group heading
    if (/^#+\s+\S/.test(line)) {
      const label = line.replace(/^#+\s+/, "").trim();
      currentGroup = { label, items: [] };
      groups.push(currentGroup);
      continue;
    }

    // Bullet item
    if (/^[-*•]\s+\S/.test(line)) {
      const item = line.replace(/^[-*•]\s+/, "").trim();
      if (!currentGroup) {
        // Items before any heading go into an unnamed group.
        currentGroup = { label: "", items: [] };
        groups.push(currentGroup);
      }
      currentGroup.items.push(item);
      continue;
    }

    // Everything else is prose (blank lines included for readability).
    proseLines.push(line);
  }

  // Drop groups that ended up with no items (heading with no bullets).
  const filledGroups = groups.filter((g) => g.items.length > 0);

  return {
    prose: proseLines.join("\n").trim(),
    groups: filledGroups,
  };
}

/** Fisher-Yates in-place shuffle. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick up to `n` items from the catalog, preferring one item per group
 * when there are multiple groups. Returns the names of the chosen items.
 */
export function sampleItems(catalog: Catalog, n = DRAFT_COUNT): string[] {
  const { groups } = catalog;
  if (groups.length === 0) return [];

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
  if (totalItems === 0) return [];

  const take = Math.min(n, totalItems);

  if (groups.length === 1) {
    // Only one group — just shuffle and take.
    return shuffle([...groups[0].items]).slice(0, take);
  }

  // Multiple groups: shuffle groups, then pick one item per group in rotation
  // until we have `take` items. This spreads picks across groups.
  const shuffledGroups = shuffle(
    groups.map((g) => ({ label: g.label, items: shuffle([...g.items]) })),
  );

  const picked: string[] = [];
  let round = 0;

  while (picked.length < take) {
    const groupIdx = round % shuffledGroups.length;
    const group = shuffledGroups[groupIdx];
    const itemIdx = Math.floor(round / shuffledGroups.length);

    if (itemIdx < group.items.length) {
      picked.push(group.items[itemIdx]);
    }

    round++;

    // Safety: if we've exhausted all slots, break.
    if (round > totalItems + shuffledGroups.length) break;
  }

  return picked.slice(0, take);
}

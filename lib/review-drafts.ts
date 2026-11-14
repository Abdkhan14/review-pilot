import { buildPrompt, anglesForPrimaryType, voiceInstruction, lengthInstruction } from "@/lib/prompt-builder";
import { generateDrafts, type DraftSlot } from "@/lib/generate-drafts";
import { parseCatalog, sampleItems, splitItem, DRAFT_COUNT } from "@/lib/catalog-items";
import { sampleRecipeTrio, type ReviewRecipe } from "@/lib/review-recipe";
import { applyTexture, applyTypo } from "@/lib/review-texture";
import { polishDraft } from "@/lib/review-polish";
import type { PlaceSnapshot } from "@/lib/place-snapshot";
import type { HumanizeContext } from "@/lib/humanize-prompt";

const DRAFT_IDS = ["a", "b", "c"] as const;
type DraftId = (typeof DRAFT_IDS)[number];

export type ReviewDraft = { id: string; text: string };

/** Sample catalog items and return the notes and item names for slot building. */
export function pickCatalogItems(rawNotes: string | undefined): {
  promptNotes: string | undefined;
  itemNames: string[];
} {
  if (!rawNotes) return { promptNotes: undefined, itemNames: [] };
  const catalog = parseCatalog(rawNotes);
  const names = sampleItems(catalog, DRAFT_COUNT);
  if (names.length === 0) return { promptNotes: rawNotes, itemNames: [] };
  return { promptNotes: catalog.prose || undefined, itemNames: names };
}

/** Build the DraftSlot array for generateDrafts alongside the matched recipes. */
export function buildSlots(
  snapshot: PlaceSnapshot,
  itemNames: string[],
  promptNotes: string | undefined,
): { slots: DraftSlot[]; recipes: ReviewRecipe[] } {
  const angles = anglesForPrimaryType(snapshot.primaryType);
  const recipes = sampleRecipeTrio(Math.random, snapshot.primaryType);
  const splitItems = itemNames.map((n) => splitItem(n));

  const slots = DRAFT_IDS.map((id, i) => {
    const recipe = recipes[i];
    const split = splitItems[i];
    const assignedItem = split?.name || undefined;
    const itemContext = split?.description || undefined;
    const messages = buildPrompt({
      id: id as DraftId,
      snapshot,
      angle: angles[i],
      recipe,
      assignedItem,
      itemContext,
      customInstructions: promptNotes,
    });
    const edit: HumanizeContext = {
      shopName: snapshot.name,
      assignedItem,
      starIntent: 5,
      voiceInstruction: voiceInstruction(recipe.voice),
      lengthInstruction: lengthInstruction(recipe.length),
    };
    return { messages, edit };
  });

  return { slots, recipes };
}

/** Apply post-processing passes to a single generated draft. */
export function finishDraft(
  draft: ReviewDraft,
  recipe: ReviewRecipe,
  protectedStrings: string[],
): ReviewDraft {
  let text = polishDraft(draft.text, protectedStrings);
  if (recipe.texture !== "clean") text = applyTexture(text, recipe.texture);
  if (recipe.typo !== "clean") text = applyTypo(text, recipe.typo, protectedStrings);
  return text !== draft.text ? { ...draft, text } : draft;
}

/** Full pipeline: generate drafts, polish, return final reviews. */
export async function writeReviewDrafts(
  snapshot: PlaceSnapshot,
  rawNotes: string | undefined,
): Promise<ReviewDraft[]> {
  const { promptNotes, itemNames } = pickCatalogItems(rawNotes);
  const { slots, recipes } = buildSlots(snapshot, itemNames, promptNotes);
  const splitItems = itemNames.map((n) => splitItem(n));

  const drafts = await generateDrafts(slots);

  return drafts.map((draft, i) => {
    const recipe = recipes[i];
    const assignedItem = splitItems[i]?.name;
    const protectedStrings = [snapshot.name, ...(assignedItem ? [assignedItem] : [])];
    return finishDraft(draft, recipe, protectedStrings);
  });
}

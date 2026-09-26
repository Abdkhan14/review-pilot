import { describe, it, expect } from "vitest";
import { sampleRecipeTrio, ALL_LENGTH_IDS, ALL_VOICE_IDS, ALL_OPENER_IDS, ALL_TEXTURE_IDS } from "./review-recipe";
import LENGTHS_JSON from "./recipes/lengths.json";
import VOICES_JSON from "./recipes/voices.json";
import OPENERS_JSON from "./recipes/openers.json";
import TEXTURES_JSON from "./recipes/textures.json";

// Restaurant-only ids as declared in the catalog files.
const RESTAURANT_ONLY_OPENER_IDS = new Set(
  (OPENERS_JSON as { id: string; kinds?: string[] }[])
    .filter((e) => e.kinds?.includes("restaurant"))
    .map((e) => e.id),
);
const RESTAURANT_ONLY_VOICE_IDS = new Set(
  (VOICES_JSON as { id: string; kinds?: string[] }[])
    .filter((e) => e.kinds?.includes("restaurant"))
    .map((e) => e.id),
);

/** Deterministic rng seeded from an index — lets us run many trio samples. */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

describe("sampleRecipeTrio", () => {
  it("returns exactly 3 recipes", () => {
    const [a, b, c] = sampleRecipeTrio();
    expect([a, b, c]).toHaveLength(3);
  });

  it("each recipe has all required fields", () => {
    const recipes = sampleRecipeTrio();
    for (const r of recipes) {
      expect(r).toHaveProperty("length");
      expect(r).toHaveProperty("voice");
      expect(r).toHaveProperty("opener");
      expect(r).toHaveProperty("item");
      expect(r).toHaveProperty("proseFact");
      expect(r).toHaveProperty("texture");
      expect(r).toHaveProperty("typo");
    }
  });

  it("trio always contains three distinct length ids", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      const lengths = new Set(recipes.map((r) => r.length));
      expect(lengths.size).toBe(3);
    }
  });

  it("all three drafts have item policy must or optional (no skip)", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      for (const r of recipes) {
        expect(["must", "optional"]).toContain(r.item);
      }
    }
  });

  it("trio always contains at most one allow prose-fact policy", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      const allowCount = recipes.filter((r) => r.proseFact === "allow").length;
      expect(allowCount).toBeLessThanOrEqual(1);
    }
  });

  it("trio always contains at most one non-clean texture", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      const nonCleanCount = recipes.filter((r) => r.texture !== "clean").length;
      expect(nonCleanCount).toBeLessThanOrEqual(1);
    }
  });

  it("typo field is always 'clean' or 'swap'", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      for (const r of recipes) {
        expect(["clean", "swap"]).toContain(r.typo);
      }
    }
  });

  it("trio always contains at most one swap typo", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      const swapCount = recipes.filter((r) => r.typo === "swap").length;
      expect(swapCount).toBeLessThanOrEqual(1);
    }
  });

  it("swap typo never appears on the same draft as a non-clean texture", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      for (const r of recipes) {
        if (r.typo === "swap") {
          expect(r.texture).toBe("clean");
        }
      }
    }
  });

  it("fewer than half of trios contain a swap typo (70% clean rate)", () => {
    let swapTrios = 0;
    const TRIALS = 500;
    for (let seed = 0; seed < TRIALS; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      if (recipes.some((r) => r.typo === "swap")) swapTrios++;
    }
    expect(swapTrios).toBeLessThan(TRIALS / 2);
  });

  it("produces varied output across different seeds", () => {
    const lengths = new Set(
      Array.from({ length: 50 }, (_, i) =>
        sampleRecipeTrio(makeRng(i)).map((r) => r.length).join(","),
      ),
    );
    expect(lengths.size).toBeGreaterThan(3);
  });

  it("sampled length ids are all valid ids from lengths.json", () => {
    const validIds = new Set(ALL_LENGTH_IDS);
    for (let seed = 0; seed < 50; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      for (const r of recipes) {
        expect(validIds).toContain(r.length);
      }
    }
  });

  it("sampled voice ids are all valid ids from voices.json", () => {
    const validIds = new Set(ALL_VOICE_IDS);
    for (let seed = 0; seed < 50; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      for (const r of recipes) {
        expect(validIds).toContain(r.voice);
      }
    }
  });

  it("sampled opener ids are all valid ids from openers.json", () => {
    const validIds = new Set(ALL_OPENER_IDS);
    for (let seed = 0; seed < 50; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      for (const r of recipes) {
        expect(validIds).toContain(r.opener);
      }
    }
  });

  it("non-clean texture ids are all valid ids from textures.json", () => {
    const validIds = new Set(ALL_TEXTURE_IDS);
    for (let seed = 0; seed < 50; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      for (const r of recipes) {
        if (r.texture !== "clean") {
          expect(validIds).toContain(r.texture);
        }
      }
    }
  });

  it("salon primaryType never produces a restaurant-only opener or voice", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed), "hair_salon");
      for (const r of recipes) {
        expect(RESTAURANT_ONLY_OPENER_IDS.has(r.opener)).toBe(false);
        expect(RESTAURANT_ONLY_VOICE_IDS.has(r.voice)).toBe(false);
      }
    }
  });

  it("generic primaryType never produces a restaurant-only opener or voice", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed), "gym");
      for (const r of recipes) {
        expect(RESTAURANT_ONLY_OPENER_IDS.has(r.opener)).toBe(false);
        expect(RESTAURANT_ONLY_VOICE_IDS.has(r.voice)).toBe(false);
      }
    }
  });

  it("missing primaryType never produces a restaurant-only opener or voice", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed), undefined);
      for (const r of recipes) {
        expect(RESTAURANT_ONLY_OPENER_IDS.has(r.opener)).toBe(false);
        expect(RESTAURANT_ONLY_VOICE_IDS.has(r.voice)).toBe(false);
      }
    }
  });

  it("restaurant primaryType can produce restaurant-only opener ids", () => {
    const seenRestaurantOnlyOpener = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed), "pizza_restaurant");
      for (const r of recipes) {
        if (RESTAURANT_ONLY_OPENER_IDS.has(r.opener)) {
          seenRestaurantOnlyOpener.add(r.opener);
        }
      }
    }
    // At least one restaurant-only opener should have appeared.
    expect(seenRestaurantOnlyOpener.size).toBeGreaterThan(0);
  });

  it("restaurant primaryType can produce restaurant-only voice ids", () => {
    const seenRestaurantOnlyVoice = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed), "pizza_restaurant");
      for (const r of recipes) {
        if (RESTAURANT_ONLY_VOICE_IDS.has(r.voice)) {
          seenRestaurantOnlyVoice.add(r.voice);
        }
      }
    }
    expect(seenRestaurantOnlyVoice.size).toBeGreaterThan(0);
  });
});

describe("recipe catalogs", () => {
  it("lengths catalog has at least 12 entries", () => {
    expect(LENGTHS_JSON.length).toBeGreaterThanOrEqual(12);
  });

  it("every length instruction caps at 6 sentences — no 7 or 8", () => {
    for (const { instruction } of LENGTHS_JSON) {
      expect(instruction).not.toMatch(/\b[78]\b/);
    }
  });

  it("voices catalog has at least 50 entries", () => {
    expect(VOICES_JSON.length).toBeGreaterThanOrEqual(50);
  });

  it("openers catalog has at least 40 entries", () => {
    expect(OPENERS_JSON.length).toBeGreaterThanOrEqual(40);
  });

  it("textures catalog has at least 20 slip ids", () => {
    expect(TEXTURES_JSON.length).toBeGreaterThanOrEqual(20);
  });

  it("all catalog entries have unique ids within their file", () => {
    for (const catalog of [LENGTHS_JSON, VOICES_JSON, OPENERS_JSON, TEXTURES_JSON]) {
      const ids = catalog.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("ALL_LENGTH_IDS matches lengths.json", () => {
    expect(ALL_LENGTH_IDS).toEqual(LENGTHS_JSON.map((l) => l.id));
  });

  it("ALL_VOICE_IDS matches voices.json", () => {
    expect(ALL_VOICE_IDS).toEqual(VOICES_JSON.map((v) => v.id));
  });

  it("ALL_OPENER_IDS matches openers.json", () => {
    expect(ALL_OPENER_IDS).toEqual(OPENERS_JSON.map((o) => o.id));
  });

  it("ALL_TEXTURE_IDS matches textures.json", () => {
    expect(ALL_TEXTURE_IDS).toEqual(TEXTURES_JSON.map((t) => t.id));
  });
});

import { describe, it, expect } from "vitest";
import { sampleRecipeTrio } from "./review-recipe";

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
    }
  });

  it("trio always contains at least two distinct length buckets", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      const lengths = new Set(recipes.map((r) => r.length));
      expect(lengths.size).toBeGreaterThanOrEqual(2);
    }
  });

  it("trio always contains exactly one skip item policy", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      const skipCount = recipes.filter((r) => r.item === "skip").length;
      expect(skipCount).toBe(1);
    }
  });

  it("non-skip slots have item policy must or optional only", () => {
    for (let seed = 0; seed < 200; seed++) {
      const recipes = sampleRecipeTrio(makeRng(seed));
      for (const r of recipes.filter((r) => r.item !== "skip")) {
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

  it("produces varied output across different seeds", () => {
    const lengths = new Set(
      Array.from({ length: 50 }, (_, i) =>
        sampleRecipeTrio(makeRng(i)).map((r) => r.length).join(","),
      ),
    );
    expect(lengths.size).toBeGreaterThan(3);
  });
});

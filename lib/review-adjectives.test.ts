import { describe, it, expect } from "vitest";
import { stripAdjectives } from "./review-adjectives";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Count the number of times `word` appears as a whole word in `text`. */
function wordCount(text: string, word: string): number {
  return (text.match(new RegExp(`\\b${word}\\b`, "gi")) ?? []).length;
}

// ─── No-op cases ─────────────────────────────────────────────────────────────

describe("stripAdjectives", () => {
  describe("no-op cases", () => {
    it("returns text unchanged when there are no adjectives to strip", () => {
      const text = "Stopped in for lunch. The wrap arrived fast.";
      expect(stripAdjectives(text)).toBe(text);
    });

    it("returns text unchanged when the only adjective is a predicate", () => {
      const text = "The food was good.";
      expect(stripAdjectives(text)).toBe(text);
    });

    it("returns text unchanged when the only adjective is a lone modifier", () => {
      const text = "Ordered the spicy chicken and it hit the spot.";
      expect(stripAdjectives(text)).toBe(text);
    });
  });

  // ─── Intensifier removal ────────────────────────────────────────────────────

  describe("intensifier removal", () => {
    it("removes 'absolutely'", () => {
      const result = stripAdjectives("The food was absolutely delicious.");
      expect(result).not.toContain("absolutely");
      expect(result).toContain("delicious");
    });

    it("removes 'really'", () => {
      const result = stripAdjectives("Service was really fast.");
      expect(result).not.toContain("really");
      expect(result).toContain("fast");
    });

    it("removes 'very'", () => {
      const result = stripAdjectives("The staff were very helpful.");
      expect(result).not.toContain("very");
      expect(result).toContain("helpful");
    });

    it("removes 'incredibly'", () => {
      const result = stripAdjectives("Incredibly good portion size.");
      expect(result).not.toContain("incredibly");
    });

    it("removes 'truly'", () => {
      const result = stripAdjectives("Truly one of the better spots around.");
      expect(result).not.toContain("truly");
    });

    it("removes 'extremely'", () => {
      const result = stripAdjectives("The wait was extremely short.");
      expect(result).not.toContain("extremely");
    });

    it("removes multiple intensifiers in one text", () => {
      const text = "Really good food and absolutely perfect service.";
      const result = stripAdjectives(text);
      expect(result).not.toContain("really");
      expect(result).not.toContain("absolutely");
    });

    it("does not leave a double space after removal", () => {
      const result = stripAdjectives("The food was absolutely delicious.");
      expect(result).not.toMatch(/  /);
    });

    it("is case-insensitive", () => {
      const result = stripAdjectives("REALLY good pizza.");
      expect(result).not.toMatch(/really/i);
    });
  });

  // ─── adj and adj pairs ──────────────────────────────────────────────────────

  describe("'adj and adj' pair collapsing", () => {
    it("collapses 'tender and juicy' to 'juicy'", () => {
      const result = stripAdjectives(
        "The shawarma was tender and juicy.",
      );
      expect(result).not.toContain("tender");
      expect(result).toContain("juicy");
    });

    it("collapses 'fresh and flavorful' to 'flavorful'", () => {
      const result = stripAdjectives("The salad was fresh and flavorful.");
      expect(result).not.toContain("fresh");
      expect(result).toContain("flavorful");
    });

    it("collapses 'friendly and professional' to 'professional'", () => {
      const result = stripAdjectives("The staff were friendly and professional.");
      expect(result).not.toContain("friendly");
      expect(result).toContain("professional");
    });

    it("produces a grammatically plausible sentence after collapsing", () => {
      const result = stripAdjectives("The crust was soft and chewy.");
      // Result should keep the second adjective, not become empty.
      expect(result).toContain("chewy");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ─── adj, adj comma pairs ───────────────────────────────────────────────────

  describe("'adj, adj' comma-pair collapsing", () => {
    it("collapses 'rich, flavorful sauce' to 'flavorful sauce'", () => {
      const result = stripAdjectives(
        "The shawarma came with a rich, flavorful sauce.",
      );
      expect(result).not.toContain("rich");
      expect(result).toContain("flavorful");
      expect(result).toContain("sauce");
    });

    it("does not leave a spurious comma after collapsing", () => {
      const result = stripAdjectives("It had a rich, flavorful sauce.");
      expect(result).not.toMatch(/,\s*,/); // no double comma
    });

    it("handles a chain of three comma-stacked adjectives", () => {
      const result = stripAdjectives(
        "The warm, crusty, golden bread was good.",
      );
      // Only the last adjective of the chain should survive.
      expect(wordCount(result, "warm")).toBe(0);
      expect(wordCount(result, "crusty")).toBe(0);
      expect(result).toContain("golden");
      expect(result).toContain("bread");
    });
  });

  // ─── Noun-phrase cap (no comma) ──────────────────────────────────────────────

  describe("noun-phrase adjective cap", () => {
    it("reduces two consecutive adjectives before a noun to the last one", () => {
      const result = stripAdjectives("Ordered the warm crusty bread.");
      expect(result).not.toContain("warm");
      expect(result).toContain("crusty");
      expect(result).toContain("bread");
    });
  });

  // ─── Combined passes ─────────────────────────────────────────────────────────

  describe("combined passes", () => {
    it("handles intensifier + 'and' pair in the same text", () => {
      const text =
        "The shawarma was absolutely tender and juicy, with a truly rich, flavorful sauce.";
      const result = stripAdjectives(text);
      expect(result).not.toContain("absolutely");
      expect(result).not.toContain("truly");
      expect(result).not.toContain("tender");
      expect(result).not.toContain("rich");
      expect(result).toContain("juicy");
      expect(result).toContain("flavorful");
    });
  });

  // ─── Protected-word guard ────────────────────────────────────────────────────

  describe("protected-word guard", () => {
    it("does not remove an intensifier that is part of a protected phrase", () => {
      // Shop named "Really Good Burgers" — "really" must survive.
      const text = "Really Good Burgers never disappoints.";
      const result = stripAdjectives(text, ["Really Good Burgers"]);
      expect(result).toContain("Really");
    });

    it("does not collapse an 'adj and adj' pair when the second adj is protected", () => {
      // Catalog item is "Flavorful Bowl" — 'flavorful' must survive and so
      // must the first adjective of the pair because the whole pair is skipped.
      const text = "The bowl was fresh and flavorful.";
      const result = stripAdjectives(text, ["Flavorful Bowl"]);
      expect(result).toContain("flavorful");
    });

    it("leaves noun-phrase adjectives intact when a protected word would be dropped", () => {
      // "Golden Latte" is a catalog item — "golden" is guarded.
      const text = "Tried the warm golden latte.";
      const result = stripAdjectives(text, ["Golden Latte"]);
      expect(result).toContain("golden");
    });
  });

  // ─── Safety ──────────────────────────────────────────────────────────────────

  describe("safety", () => {
    it("never returns an empty string", () => {
      // Pathological: only an intensifier — should return original, not "".
      expect(stripAdjectives("absolutely")).toBe("absolutely");
    });

    it("does not leave double spaces", () => {
      const result = stripAdjectives(
        "The food was really very tender and juicy.",
      );
      expect(result).not.toMatch(/  /);
    });

    it("does not leave a leading or trailing space", () => {
      const result = stripAdjectives("Really great service.");
      expect(result.trimStart()).toBe(result);
      expect(result.trimEnd()).toBe(result);
    });

    it("passes an empty string through unchanged", () => {
      expect(stripAdjectives("")).toBe("");
    });
  });
});

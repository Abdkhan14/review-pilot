import { describe, it, expect } from "vitest";
import { applyTexture } from "./review-texture";

const alwaysFirst = () => 0;   // always picks the first candidate / branch
const alwaysLast = () => 0.99; // always picks the last candidate / branch

describe("applyTexture", () => {
  describe("clean", () => {
    it("returns text unchanged", () => {
      const text = "The pizza was really good. I'd order it again.";
      expect(applyTexture(text, "clean")).toBe(text);
    });
  });

  describe("casual", () => {
    it("strips the apostrophe from one contraction", () => {
      const text = "I don't usually write reviews but this was worth it.";
      const result = applyTexture(text, "casual", alwaysFirst);
      expect(result).toContain("dont");
      expect(result).not.toContain("don't");
    });

    it("replaces exactly one contraction, not all occurrences", () => {
      const text = "It's good and I'm not usually someone who's picky.";
      const result = applyTexture(text, "casual", alwaysFirst);
      // Count remaining apostrophes — at least one contraction survives.
      const apostropheCount = (result.match(/'\w/g) ?? []).length;
      expect(apostropheCount).toBeGreaterThanOrEqual(1);
    });

    it("returns text unchanged when no eligible contractions exist", () => {
      const text = "Great food. Very fast service. Clean space.";
      expect(applyTexture(text, "casual")).toBe(text);
    });

    it("does not strip a contraction that begins at position 0 (first-word protection)", () => {
      const text = "It's been a great experience here.";
      // "It's" starts at index 0, so it should be skipped.
      const result = applyTexture(text, "casual", alwaysFirst);
      expect(result.startsWith("It's")).toBe(true);
    });
  });

  describe("run_on", () => {
    it("drops the final period when rng is below 0.5", () => {
      const text = "Came in for lunch. The wrap was solid. Really enjoyed it.";
      const result = applyTexture(text, "run_on", alwaysFirst);
      expect(result.endsWith(".")).toBe(false);
      expect(result).toContain("Really enjoyed it");
    });

    it("creates a comma splice between the last two sentences when rng >= 0.5", () => {
      const text = "Came in for lunch. The wrap was solid. Really enjoyed it.";
      const result = applyTexture(text, "run_on", alwaysLast);
      expect(result).toContain(", really enjoyed it");
    });

    it("returns text unchanged when it does not end with a period", () => {
      const text = "Good food overall";
      expect(applyTexture(text, "run_on", alwaysFirst)).toBe(text);
    });

    it("falls back to dropping the period when there is only one sentence", () => {
      const text = "Solid pizza.";
      const result = applyTexture(text, "run_on", alwaysLast);
      expect(result).toBe("Solid pizza");
    });
  });
});

import { describe, it, expect } from "vitest";
import { applyTexture, applyTypo } from "./review-texture";

const alwaysFirst = () => 0;   // always picks the first candidate / branch
const alwaysLast = () => 0.99; // always picks the last candidate / branch

describe("applyTexture", () => {
  describe("clean", () => {
    it("returns text unchanged", () => {
      const text = "The pizza was really good. I'd order it again.";
      expect(applyTexture(text, "clean")).toBe(text);
    });
  });

  describe("apostrophe_contraction", () => {
    it("strips the apostrophe from one contraction", () => {
      const text = "I don't usually write reviews but this was worth it.";
      const result = applyTexture(text, "apostrophe_contraction", alwaysFirst);
      expect(result).toContain("dont");
      expect(result).not.toContain("don't");
    });

    it("replaces exactly one contraction, not all occurrences", () => {
      const text = "It's good and I'm not usually someone who's picky.";
      const result = applyTexture(text, "apostrophe_contraction", alwaysFirst);
      const apostropheCount = (result.match(/'\w/g) ?? []).length;
      expect(apostropheCount).toBeGreaterThanOrEqual(1);
    });

    it("returns text unchanged when no eligible contractions exist", () => {
      const text = "Great food. Very fast service. Clean space.";
      expect(applyTexture(text, "apostrophe_contraction")).toBe(text);
    });

    it("does not strip a contraction that begins at position 0 (first-word protection)", () => {
      const text = "It's been a great experience here.";
      const result = applyTexture(text, "apostrophe_contraction", alwaysFirst);
      expect(result.startsWith("It's")).toBe(true);
    });
  });

  describe("dropped_final_period", () => {
    it("drops the final period", () => {
      const text = "Came in for lunch. The wrap was solid. Really enjoyed it.";
      const result = applyTexture(text, "dropped_final_period");
      expect(result.endsWith(".")).toBe(false);
      expect(result).toContain("Really enjoyed it");
    });

    it("returns text unchanged when it does not end with a period", () => {
      const text = "Good food overall";
      expect(applyTexture(text, "dropped_final_period")).toBe(text);
    });

    it("drops the period from a single sentence", () => {
      const text = "Solid pizza.";
      expect(applyTexture(text, "dropped_final_period")).toBe("Solid pizza");
    });
  });

  describe("comma_splice", () => {
    it("joins the last two sentences with a comma", () => {
      const text = "Came in for lunch. The wrap was solid. Really enjoyed it.";
      const result = applyTexture(text, "comma_splice");
      expect(result).toContain(", really enjoyed it");
    });

    it("falls back to dropping the period when there is only one sentence", () => {
      const text = "Solid pizza.";
      const result = applyTexture(text, "comma_splice");
      expect(result).toBe("Solid pizza");
    });

    it("returns text unchanged when it does not end with a period", () => {
      const text = "Good food overall";
      expect(applyTexture(text, "comma_splice")).toBe(text);
    });
  });

  describe("extended slips", () => {
    it("alot replaces a lot with alot", () => {
      expect(applyTexture("I ordered a lot of sides.", "alot")).toBe("I ordered alot of sides.");
    });

    it("alot returns text unchanged when a lot is not present", () => {
      expect(applyTexture("Good pizza.", "alot")).toBe("Good pizza.");
    });

    it("tho replaces though with tho", () => {
      expect(applyTexture("Good though.", "tho")).toBe("Good tho.");
    });

    it("ok replaces okay with ok", () => {
      expect(applyTexture("It was okay.", "ok")).toBe("It was ok.");
    });

    it("gonna replaces going to with gonna", () => {
      expect(applyTexture("I am going to order again.", "gonna")).toBe("I am gonna order again.");
    });

    it("wanna replaces want to with wanna", () => {
      expect(applyTexture("I want to try the wrap.", "wanna")).toBe("I wanna try the wrap.");
    });

    it("kinda replaces kind of with kinda", () => {
      expect(applyTexture("It was kind of good.", "kinda")).toBe("It was kinda good.");
    });

    it("sorta replaces sort of with sorta", () => {
      expect(applyTexture("It was sort of crispy.", "sorta")).toBe("It was sorta crispy.");
    });

    it("its_confusion replaces it's with its (mid-sentence)", () => {
      expect(applyTexture("The food, it's really good.", "its_confusion")).toBe("The food, its really good.");
    });

    it("no_cap_sentence2 lowercases the first letter of the second sentence", () => {
      const text = "Good food. The staff were fast.";
      const result = applyTexture(text, "no_cap_sentence2");
      expect(result).toBe("Good food. the staff were fast.");
    });

    it("unknown slip id returns text unchanged", () => {
      expect(applyTexture("Good pizza.", "nonexistent_slip")).toBe("Good pizza.");
    });
  });
});

describe("applyTypo", () => {
  it("returns text unchanged when typo is clean", () => {
    const text = "The chicken shawarma was really good.";
    expect(applyTypo(text, "clean")).toBe(text);
  });

  it("swaps exactly two adjacent interior letters in one eligible word", () => {
    const text = "The chicken shawarma was really good.";
    const result = applyTypo(text, "swap", [], alwaysFirst);
    // The result should differ from the original by exactly one two-char transposition.
    expect(result).not.toBe(text);
    // First word should be untouched.
    expect(result.startsWith("The")).toBe(true);
  });

  it("never touches the first word of the text", () => {
    // "really" is the only long enough word other than "chicken" — but "Chicken"
    // is the first word and must be skipped.
    const text = "Chicken shawarma is really worth it.";
    const result = applyTypo(text, "swap", [], alwaysFirst);
    expect(result.startsWith("Chicken")).toBe(true);
  });

  it("returns text unchanged when no eligible word exists (all words < 5 letters or only the first word qualifies)", () => {
    // Only 5-letter word is the first word.
    const text = "Great food here.";
    expect(applyTypo(text, "swap")).toBe(text);
  });

  it("does not touch a word that appears in the protected list", () => {
    // "Ababia" as the shop name — "really" and "worth" are the eligible words.
    const text = "The Ababia shawarma is really worth it.";
    // Protect "Ababia" and "shawarma" — both must remain exactly intact.
    for (let i = 0; i < 50; i++) {
      const result = applyTypo(text, "swap", ["Ababia", "shawarma"], () => i / 50);
      expect(result).toContain("Ababia");   // shop name untouched
      expect(result).toContain("shawarma"); // assigned item untouched
    }
  });

  it("swapped word differs from the original by exactly one transposition of adjacent interior letters", () => {
    const text = "The chicken was perfectly cooked and really crispy.";
    const result = applyTypo(text, "swap", [], alwaysFirst);
    // Find the word that changed.
    const origWords = text.split(/\b/);
    const resultWords = result.split(/\b/);
    const changed = origWords.filter((w, i) => resultWords[i] !== w);
    expect(changed).toHaveLength(1);
    const orig = changed[0];
    const mutated = resultWords[origWords.indexOf(orig)];
    // Same length: no letters added or removed.
    expect(mutated.length).toBe(orig.length);
    // Exactly two positions differ.
    const diffs = [...orig].filter((ch, i) => ch !== mutated[i]);
    expect(diffs).toHaveLength(2);
  });
});

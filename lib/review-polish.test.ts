import { describe, it, expect } from "vitest";
import { polishDraft } from "./review-polish";

// ─── No-op ────────────────────────────────────────────────────────────────────

describe("polishDraft", () => {
  describe("no-op", () => {
    it("returns clean text unchanged", () => {
      const text = "Stopped in for the wrap. The filling was good and service was quick.";
      expect(polishDraft(text)).toBe(text);
    });

    it("passes an empty string through unchanged", () => {
      expect(polishDraft("")).toBe("");
    });
  });

  // ─── Punctuation normalisation ───────────────────────────────────────────────

  describe("exclamation marks", () => {
    it("converts a trailing exclamation mark to a period", () => {
      const result = polishDraft("The food was good!");
      expect(result).not.toContain("!");
      expect(result).toContain("good.");
    });

    it("converts an exclamation mid-review to a period", () => {
      const result = polishDraft("The wrap was good! Service was fast.");
      expect(result).not.toContain("!");
    });
  });

  describe("em dashes", () => {
    it("converts an em dash to a comma", () => {
      const result = polishDraft("Came in for lunch — the wrap was solid.");
      expect(result).not.toContain("—");
      expect(result).toContain(",");
    });

    it("does not leave a space before the comma after em dash replacement", () => {
      const result = polishDraft("Came in for lunch — the wrap was solid.");
      expect(result).not.toMatch(/\s,/);
    });

    it("does not leave a dangling comma when the em dash was before a period", () => {
      const result = polishDraft("The wrap was solid —.");
      expect(result).not.toContain(",.");
    });
  });

  // ─── Banned-closer sentence drop ────────────────────────────────────────────

  describe("banned closers", () => {
    it("drops a sentence containing 'highly recommend' when another sentence exists", () => {
      const result = polishDraft(
        "The wrap was solid. I highly recommend this place.",
      );
      expect(result).toContain("wrap");
      expect(result).not.toContain("highly recommend");
    });

    it("drops a sentence containing 'hidden gem' when another sentence exists", () => {
      const result = polishDraft("Good food. Hidden gem.");
      expect(result).toContain("Good food");
      expect(result).not.toContain("hidden gem");
    });

    it("drops a sentence containing 'will be back' when another sentence exists", () => {
      const result = polishDraft("Ordered the pita. Will be back.");
      expect(result).toContain("pita");
      expect(result).not.toContain("will be back");
    });

    it("drops a sentence containing 'must try' when another sentence exists", () => {
      const result = polishDraft("Good portion. Must try the shawarma.");
      expect(result).toContain("portion");
      expect(result).not.toContain("must try");
    });

    it("leaves a single-sentence review that is a closer unchanged", () => {
      // Can't drop the only sentence — nothing would remain.
      const text = "Hidden gem.";
      const result = polishDraft(text);
      expect(result).toBeTruthy();
    });

    it("leaves all sentences when none contain a banned closer", () => {
      const text = "The wrap was solid. Service was quick.";
      expect(polishDraft(text)).toBe(text);
    });

    it("drops multiple closer sentences when a non-closer sentence remains", () => {
      const result = polishDraft(
        "The wrap was solid. Hidden gem. Highly recommend.",
      );
      expect(result).toContain("wrap");
      expect(result).not.toContain("hidden gem");
      expect(result).not.toContain("highly recommend");
    });

    // ─── Extended BANNED_CLOSERS ────────────────────────────────────────────

    it("drops 'by the way' closer sentence", () => {
      const result = polishDraft("The pita was good. By the way, this place is worth a visit.");
      expect(result).toContain("pita");
      expect(result).not.toContain("By the way");
    });

    it("drops 'it's rare to find' sentence", () => {
      const result = polishDraft("Good portion. It's rare to find quality like this.");
      expect(result).toContain("portion");
      expect(result).not.toContain("rare to find");
    });

    it("drops 'attention to detail' sentence", () => {
      const result = polishDraft("The cut looked clean. That kind of attention to detail matters.");
      expect(result).toContain("cut");
      expect(result).not.toContain("attention to detail");
    });

    it("drops 'welcoming atmosphere' sentence", () => {
      const result = polishDraft("Service was fast. The welcoming atmosphere made it easy to relax.");
      expect(result).toContain("fast");
      expect(result).not.toContain("welcoming atmosphere");
    });

    it("drops 'made all the difference' sentence", () => {
      const result = polishDraft("The filling was solid. That little touch made all the difference.");
      expect(result).toContain("filling");
      expect(result).not.toContain("made all the difference");
    });

    it("drops 'leave an impression' sentence", () => {
      const result = polishDraft("Good food. Small gestures like that leave an impression.");
      expect(result).toContain("food");
      expect(result).not.toContain("leave an impression");
    });

    it("drops 'leaves an impression' sentence", () => {
      const result = polishDraft("Good food. That kind of thing leaves an impression.");
      expect(result).toContain("food");
      expect(result).not.toContain("leaves an impression");
    });

    it("drops 'feel confident' sentence", () => {
      const result = polishDraft("The consultation went well. It was easy to feel confident throughout.");
      expect(result).toContain("consultation");
      expect(result).not.toContain("feel confident");
    });

    it("leaves a single-sentence review containing a new closer unchanged", () => {
      const text = "It's rare to find a place this good.";
      const result = polishDraft(text);
      expect(result).toBeTruthy();
    });

    // ─── Lowercase-start preservation ──────────────────────────────────────

    it("preserves a lowercase sentence start introduced before polish (texture slip)", () => {
      // 'leaving' starts with a lowercase letter intentionally — polishDraft
      // must not recapitalize it when splitting or joining sentences.
      const text = "leaving the shop, I got the sandwich.";
      const result = polishDraft(text);
      expect(result.startsWith("leaving")).toBe(true);
    });

    it("preserves lowercase start when a closer is dropped from a multi-sentence review", () => {
      const result = polishDraft("leaving the shop, I got the sandwich. Small gestures like that leave an impression.");
      expect(result.startsWith("leaving")).toBe(true);
      expect(result).not.toContain("leave an impression");
    });
  });

  // ─── Per-sentence contractions ───────────────────────────────────────────────

  describe("contractions", () => {
    it("contracts 'I am' to \"I'm\"", () => {
      const result = polishDraft("I am glad I stopped in.");
      expect(result).toContain("I'm");
      expect(result).not.toContain("I am");
    });

    it("contracts 'Do not' to \"Don't\"", () => {
      const result = polishDraft("Do not skip the pita.");
      expect(result).toContain("Don't");
    });

    it("contracts across a multi-sentence review", () => {
      const result = polishDraft(
        "I am glad I came. It is exactly what I was after.",
      );
      expect(result).toContain("I'm");
      expect(result).toContain("It's");
    });

    it("does not alter a shop name that contains an apostrophe", () => {
      const result = polishDraft("Stopped at Joe's Pizza. It is good.");
      expect(result).toContain("Joe's Pizza");
    });
  });

  // ─── Hashtag removal ─────────────────────────────────────────────────────────

  describe("hashtags", () => {
    it("removes a leading hashtag", () => {
      const result = polishDraft("#bestpizza the crust was good.");
      expect(result).not.toContain("#bestpizza");
      expect(result).toContain("crust");
    });

    it("removes a hashtag that appears mid-review", () => {
      const result = polishDraft("Good food. #lunch Great service.");
      expect(result).not.toContain("#lunch");
    });
  });

  // ─── Denylisted -ly adverbs ──────────────────────────────────────────────────

  describe("denylisted adverbs", () => {
    it("removes 'seamlessly'", () => {
      const result = polishDraft("The wrap was seamlessly prepared.");
      expect(result).not.toContain("seamlessly");
    });

    it("removes 'perfectly'", () => {
      const result = polishDraft("The sauce was perfectly balanced.");
      expect(result).not.toContain("perfectly");
    });

    it("removes 'effortlessly'", () => {
      const result = polishDraft("Service ran effortlessly from start to finish.");
      expect(result).not.toContain("effortlessly");
    });

    it("removes 'beautifully'", () => {
      const result = polishDraft("The dish was beautifully presented.");
      expect(result).not.toContain("beautifully");
    });

    it("removes 'wonderfully'", () => {
      const result = polishDraft("The space was wonderfully quiet.");
      expect(result).not.toContain("wonderfully");
    });

    it("keeps 'quickly' because timing voice recipes depend on it", () => {
      const result = polishDraft("The order came out quickly.");
      expect(result).toContain("quickly");
    });

    it("keeps 'slowly' because it is not on the denylist", () => {
      const result = polishDraft("We ate slowly and enjoyed it.");
      expect(result).toContain("slowly");
    });
  });

  // ─── Combined example ────────────────────────────────────────────────────────

  describe("combined passes", () => {
    it("applies the full chain from the plan example", () => {
      const input =
        "I am glad I went — the shawarma was seamlessly good! Hidden gem.";
      const result = polishDraft(input);

      // Contractions
      expect(result).toContain("I'm");
      // Em dash converted
      expect(result).not.toContain("—");
      // Exclamation converted
      expect(result).not.toContain("!");
      // Denylisted adverb removed
      expect(result).not.toContain("seamlessly");
      // Banned closer sentence dropped
      expect(result).not.toContain("Hidden gem");
      // Core content preserved
      expect(result).toContain("shawarma");
    });
  });

  // ─── Colon item description stripping ───────────────────────────────────────

  describe("inline colon descriptions", () => {
    it("strips the description after a mid-sentence colon, keeping the main clause", () => {
      const result = polishDraft(
        "The classic poutine: fries with gravy and cheese curds did not disappoint.",
      );
      expect(result).toContain("poutine");
      expect(result).not.toContain("fries with gravy");
      expect(result).toContain("disappoint");
    });

    it("leaves text with no colon unchanged", () => {
      const text = "The tahini added a good note to each bite.";
      expect(polishDraft(text)).toBe(text);
    });

    it("does not strip a colon followed by an uppercase word (not mid-sentence)", () => {
      // Uppercase after colon is not our pattern — leave untouched.
      const text = "Shop notes: Fresh ingredients used daily.";
      expect(polishDraft(text)).toContain("Fresh ingredients");
    });

    it("leaves the text unchanged when there is no finite verb after the colon", () => {
      // Description with no finite verb — no safe split point, leave it.
      const text = "Tried the tahini: smooth and creamy.";
      expect(polishDraft(text)).toBeTruthy();
    });
  });

  // ─── Extended BANNED_CLOSERS ─────────────────────────────────────────────────

  describe("extended banned closers", () => {
    it("drops 'by the way' sentence", () => {
      const result = polishDraft("The pita was good. By the way, this place is worth a visit.");
      expect(result).toContain("pita");
      expect(result).not.toContain("By the way");
    });

    it("drops 'it's rare to find' sentence", () => {
      const result = polishDraft("Good portion. It's rare to find quality like this.");
      expect(result).toContain("portion");
      expect(result).not.toContain("rare to find");
    });

    it("drops 'attention to detail' sentence", () => {
      const result = polishDraft("The cut looked clean. That kind of attention to detail matters.");
      expect(result).toContain("cut");
      expect(result).not.toContain("attention to detail");
    });

    it("drops 'welcoming atmosphere' sentence", () => {
      const result = polishDraft("Service was fast. The welcoming atmosphere made it easy to relax.");
      expect(result).toContain("fast");
      expect(result).not.toContain("welcoming atmosphere");
    });

    it("drops 'made all the difference' sentence", () => {
      const result = polishDraft("The filling was solid. That little touch made all the difference.");
      expect(result).toContain("filling");
      expect(result).not.toContain("made all the difference");
    });

    it("drops 'leave an impression' sentence", () => {
      const result = polishDraft("Good food. Small gestures like that leave an impression.");
      expect(result).toContain("food");
      expect(result).not.toContain("leave an impression");
    });

    it("drops 'leaves an impression' sentence", () => {
      const result = polishDraft("Good food. That kind of thing leaves an impression.");
      expect(result).toContain("food");
      expect(result).not.toContain("leaves an impression");
    });

    it("drops 'feel confident' sentence", () => {
      const result = polishDraft("The consultation went well. It was easy to feel confident throughout.");
      expect(result).toContain("consultation");
      expect(result).not.toContain("feel confident");
    });

    it("drops 'I noticed' sentence", () => {
      const result = polishDraft("Good portion. I noticed the sauce was well seasoned.");
      expect(result).toContain("portion");
      expect(result).not.toContain("I noticed");
    });

    it("drops 'Overall' sentence", () => {
      const result = polishDraft("The pita was solid. Overall, the experience was good.");
      expect(result).toContain("pita");
      expect(result).not.toContain("Overall");
    });

    it("leaves a single-sentence review containing a new closer unchanged", () => {
      const text = "It's rare to find a place this good.";
      expect(polishDraft(text)).toBeTruthy();
    });

    it("leaves a single-sentence review starting with Overall unchanged", () => {
      const text = "Overall the cut was solid.";
      expect(polishDraft(text)).toBeTruthy();
    });

    it("leaves a single-sentence review with I noticed unchanged", () => {
      const text = "I noticed the cut held up well.";
      expect(polishDraft(text)).toBeTruthy();
    });
  });

  // ─── Lowercase-start preservation ────────────────────────────────────────────

  describe("lowercase start preservation", () => {
    it("preserves a lowercase sentence start (texture slip)", () => {
      // 'leaving' starts with lowercase intentionally — must not be recapitalized.
      const text = "leaving the shop, I got the sandwich.";
      const result = polishDraft(text);
      expect(result.startsWith("leaving")).toBe(true);
    });

    it("preserves lowercase start when a closer sentence is dropped", () => {
      const result = polishDraft(
        "leaving the shop, I got the sandwich. Small gestures like that leave an impression.",
      );
      expect(result.startsWith("leaving")).toBe(true);
      expect(result).not.toContain("leave an impression");
    });
  });

  // ─── Safety ──────────────────────────────────────────────────────────────────

  describe("safety", () => {
    it("never returns an empty string even for pathological input", () => {
      expect(polishDraft("Absolutely!")).toBeTruthy();
    });

    it("does not leave double spaces", () => {
      const result = polishDraft(
        "The shawarma was seamlessly tender and absolutely juicy!",
      );
      expect(result).not.toMatch(/  /);
    });

    it("does not leave a leading or trailing space", () => {
      const result = polishDraft("Really great service!");
      expect(result.trimStart()).toBe(result);
      expect(result.trimEnd()).toBe(result);
    });
  });
});

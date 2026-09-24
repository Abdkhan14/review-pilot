import { describe, it, expect } from "vitest";
import { buildPrompt, anglesForPrimaryType } from "./prompt-builder";
import type { BuildPromptInput } from "./prompt-builder";
import type { PlaceSnapshot } from "./place-snapshot";
import type { ReviewRecipe } from "./review-recipe";
import RESTAURANT_POOL from "./angles/restaurant.json";
import SALON_POOL from "./angles/salon.json";
import GENERIC_POOL from "./angles/generic.json";

const JOES: PlaceSnapshot = {
  placeId: "ChIJhUnH0T7U1IkR6N_N0K0P67M",
  name: "Joe's Pizza",
  address: "123 Main St, Brooklyn, NY 11201, USA",
  primaryType: "pizza_restaurant",
  rating: 4.6,
  userRatingCount: 1284,
  editorialSummary: "Thin-crust slice shop.",
  writeReviewUrl:
    "https://search.google.com/local/writereview?placeid=ChIJhUnH0T7U1IkR6N_N0K0P67M",
  reviews: [
    { rating: 5, text: "Best pepperoni in the neighborhood.", relativeTime: "2 months ago" },
  ],
  fetchedAt: "2026-09-14T00:00:00.000Z",
};

const SAMPLE_ANGLE = { label: "the first bite", pick: "the main you started with, not a garnish, sauce, or extra" };

const BASE_RECIPE: ReviewRecipe = {
  length: "short",
  voice: "specific",
  opener: "i_first",
  item: "must",
  proseFact: "forbid",
  texture: "clean",
};

const BASE_INPUT: BuildPromptInput = {
  id: "a",
  snapshot: JOES,
  angle: SAMPLE_ANGLE,
  recipe: BASE_RECIPE,
};

const EXAMPLES_HEADING = "Existing Google reviews (examples only — do not copy):";

function promptText(messages: { role: string; content: string }[]): string {
  return messages.map((m) => m.content).join("\n");
}

describe("buildPrompt", () => {
  it("returns a system message then a user message", () => {
    const messages = buildPrompt(BASE_INPUT);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
    expect(messages[0].content.length).toBeGreaterThan(0);
    expect(messages[1].content.length).toBeGreaterThan(0);
  });

  it("puts snapshot name and primaryType in the user message", () => {
    const text = promptText(buildPrompt(BASE_INPUT));
    expect(text).toContain("Joe's Pizza");
    expect(text).toContain("pizza_restaurant");
  });

  it("puts the angle label in the system message", () => {
    const sys = buildPrompt(BASE_INPUT)[0].content;
    expect(sys).toContain(SAMPLE_ANGLE.label);
  });

  it("encodes the JSON output shape with the correct id and angle", () => {
    const sys = buildPrompt({ ...BASE_INPUT, id: "b" })[0].content;
    expect(sys).toContain('"id": "b"');
    expect(sys).toContain(SAMPLE_ANGLE.label);
  });

  it("encodes length=one_liner as exactly 1 sentence", () => {
    const sys = buildPrompt({ ...BASE_INPUT, recipe: { ...BASE_RECIPE, length: "one_liner" } })[0].content;
    expect(sys).toMatch(/1 sentence/i);
  });

  it("encodes length=ramble as 6–8 sentences", () => {
    const sys = buildPrompt({ ...BASE_INPUT, recipe: { ...BASE_RECIPE, length: "ramble" } })[0].content;
    expect(sys).toMatch(/6.8 sentences/i);
  });

  it("encodes item=skip to forbid any catalog item", () => {
    const sys = buildPrompt({ ...BASE_INPUT, recipe: { ...BASE_RECIPE, item: "skip" } })[0].content;
    expect(sys).toMatch(/do not name any catalog item/i);
  });

  it("encodes item=must with the assigned item name", () => {
    const sys = buildPrompt({ ...BASE_INPUT, recipe: { ...BASE_RECIPE, item: "must" }, assignedItem: "Shawarma" })[0].content;
    expect(sys).toContain("Shawarma");
    expect(sys).toMatch(/name shawarma once/i);
  });

  it("encodes item=optional with the assigned item name", () => {
    const sys = buildPrompt({ ...BASE_INPUT, recipe: { ...BASE_RECIPE, item: "optional" }, assignedItem: "Hummus" })[0].content;
    expect(sys).toContain("Hummus");
    expect(sys).toMatch(/may appear if it fits/i);
  });

  it("encodes proseFact=forbid to block staff and prose details", () => {
    const sys = buildPrompt({ ...BASE_INPUT, recipe: { ...BASE_RECIPE, proseFact: "forbid" } })[0].content;
    expect(sys).toMatch(/do not name staff/i);
  });

  it("encodes proseFact=allow to permit shop note atmosphere details", () => {
    const sys = buildPrompt({ ...BASE_INPUT, recipe: { ...BASE_RECIPE, proseFact: "allow" } })[0].content;
    expect(sys).toMatch(/shop notes may inform/i);
  });

  it("encodes texture=casual in the grammar rule", () => {
    const sys = buildPrompt({ ...BASE_INPUT, recipe: { ...BASE_RECIPE, texture: "casual" } })[0].content;
    expect(sys).toMatch(/apostrophe/i);
  });

  it("encodes texture=run_on in the grammar rule", () => {
    const sys = buildPrompt({ ...BASE_INPUT, recipe: { ...BASE_RECIPE, texture: "run_on" } })[0].content;
    expect(sys).toMatch(/comma splice/i);
  });

  it("bans marketing closers from the system prompt", () => {
    const sys = buildPrompt(BASE_INPUT)[0].content;
    expect(sys).toContain("highly recommend");
    expect(sys).toContain("hidden gem");
    expect(sys).toContain("must try");
  });

  it("mentions a 5-star tone when starIntent is omitted", () => {
    const text = promptText(buildPrompt(BASE_INPUT));
    expect(text).toMatch(/5[- ]star/i);
  });

  it("includes custom instructions in the user message", () => {
    const text = promptText(buildPrompt({ ...BASE_INPUT, customInstructions: "mention the garlic knots" }));
    expect(text).toContain("mention the garlic knots");
  });

  it("omits example Google reviews when shop notes are present", () => {
    const text = promptText(buildPrompt({ ...BASE_INPUT, customInstructions: "great knots" }));
    expect(text).not.toContain(EXAMPLES_HEADING);
    expect(text).not.toContain("Best pepperoni in the neighborhood.");
  });

  it("includes example Google reviews when no shop notes are present", () => {
    const text = promptText(buildPrompt(BASE_INPUT));
    expect(text).toContain(EXAMPLES_HEADING);
    expect(text).toContain("Best pepperoni in the neighborhood.");
  });

  it("still produces a prompt when snapshot reviews are missing", () => {
    const { reviews: _reviews, ...noReviews } = JOES;
    const messages = buildPrompt({ ...BASE_INPUT, snapshot: noReviews });
    expect(messages).toHaveLength(2);
    expect(promptText(messages)).toContain("Joe's Pizza");
  });

  it("still produces a prompt when snapshot reviews are an empty array", () => {
    const messages = buildPrompt({ ...BASE_INPUT, snapshot: { ...JOES, reviews: [] } });
    expect(messages).toHaveLength(2);
    expect(promptText(messages)).not.toContain(EXAMPLES_HEADING);
  });

  it("does not put placeId or writeReviewUrl in the prompt", () => {
    const text = promptText(buildPrompt(BASE_INPUT));
    expect(text).not.toContain(JOES.placeId);
    expect(text).not.toContain(JOES.writeReviewUrl);
  });
});

describe("anglesForPrimaryType", () => {
  it("returns exactly 3 angles for a restaurant type, all from the restaurant pool", () => {
    const angles = anglesForPrimaryType("pizza_restaurant");
    expect(angles).toHaveLength(3);
    const labels = (RESTAURANT_POOL as { label: string }[]).map((a) => a.label);
    for (const angle of angles) {
      expect(labels).toContain(angle.label);
    }
  });

  it("returns exactly 3 angles for a salon type, all from the salon pool", () => {
    const angles = anglesForPrimaryType("hair_salon");
    expect(angles).toHaveLength(3);
    const labels = (SALON_POOL as { label: string }[]).map((a) => a.label);
    for (const angle of angles) {
      expect(labels).toContain(angle.label);
    }
  });

  it("returns exactly 3 angles from the generic pool when primaryType is missing", () => {
    const angles = anglesForPrimaryType(undefined);
    expect(angles).toHaveLength(3);
    const labels = (GENERIC_POOL as { label: string }[]).map((a) => a.label);
    for (const angle of angles) {
      expect(labels).toContain(angle.label);
    }
  });

  it("uses the spa pool for a spa type", () => {
    const angles = anglesForPrimaryType("spa");
    const labels = (SALON_POOL as { label: string }[]).map((a) => a.label);
    for (const angle of angles) {
      expect(labels).toContain(angle.label);
    }
  });
});

describe("angle pools", () => {
  const BANNED_SUBSTRINGS = ["tell a friend", "come back", "book next time"];

  it("restaurant pool has at least 80 angles", () => {
    expect(RESTAURANT_POOL.length).toBeGreaterThanOrEqual(80);
  });

  it("salon pool has at least 80 angles", () => {
    expect(SALON_POOL.length).toBeGreaterThanOrEqual(80);
  });

  it("generic pool has at least 80 angles", () => {
    expect(GENERIC_POOL.length).toBeGreaterThanOrEqual(80);
  });

  it("restaurant pool labels contain no banned marketing substrings", () => {
    for (const { label } of RESTAURANT_POOL as { label: string }[]) {
      for (const banned of BANNED_SUBSTRINGS) {
        expect(label).not.toContain(banned);
      }
    }
  });

  it("salon pool labels contain no banned marketing substrings", () => {
    for (const { label } of SALON_POOL as { label: string }[]) {
      for (const banned of BANNED_SUBSTRINGS) {
        expect(label).not.toContain(banned);
      }
    }
  });

  it("generic pool labels contain no banned marketing substrings", () => {
    for (const { label } of GENERIC_POOL as { label: string }[]) {
      for (const banned of BANNED_SUBSTRINGS) {
        expect(label).not.toContain(banned);
      }
    }
  });
});

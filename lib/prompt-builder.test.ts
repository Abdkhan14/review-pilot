import { describe, it, expect } from "vitest";
import { buildPrompt } from "./prompt-builder";
import type { PlaceSnapshot } from "./place-snapshot";

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
    {
      rating: 5,
      text: "Best pepperoni in the neighborhood.",
      relativeTime: "2 months ago",
    },
  ],
  fetchedAt: "2026-09-14T00:00:00.000Z",
};

const EXAMPLES_HEADING =
  "Existing Google reviews (examples only — do not copy):";

function promptText(
  messages: { role: string; content: string }[],
): string {
  return messages.map((m) => m.content).join("\n");
}

describe("buildPrompt", () => {
  it("returns a system message then a user message", () => {
    const messages = buildPrompt({ snapshot: JOES });
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
    expect(messages[0].content.length).toBeGreaterThan(0);
    expect(messages[1].content.length).toBeGreaterThan(0);
  });

  it("puts the fixture snapshot name and primaryType in the prompt", () => {
    const text = promptText(buildPrompt({ snapshot: JOES }));
    expect(text).toContain("Joe's Pizza");
    expect(text).toContain("pizza_restaurant");
  });

  it("includes custom instructions", () => {
    const text = promptText(
      buildPrompt({
        snapshot: JOES,
        customInstructions: "mention the garlic knots",
      }),
    );
    expect(text).toContain("mention the garlic knots");
  });

  it("tells the model to pick at random from the whole shop-notes pool", () => {
    const text = promptText(
      buildPrompt({
        snapshot: JOES,
        customInstructions:
          "Shawarma platter, mixed grill, baklava, mint tea",
      }),
    );
    expect(text).toMatch(/at random from the whole (list|pool)/i);
    expect(text).toMatch(/do not prefer the first or last item/i);
    expect(text).not.toMatch(/different stretch of the shop notes/i);
  });

  it("tells the model consecutive generations must not reuse the same items", () => {
    const text = promptText(
      buildPrompt({
        snapshot: JOES,
        customInstructions:
          "Shawarma platter, mixed grill, baklava, mint tea",
      }),
    );
    expect(text).toMatch(/consecutive generations must not/i);
  });

  it("says shop notes override the rest of the prompt", () => {
    const text = promptText(
      buildPrompt({
        snapshot: JOES,
        customInstructions: "mention the garlic knots",
      }),
    );
    expect(text).toMatch(/shop notes override/i);
  });

  it("passes shop notes through unchanged", () => {
    const notes =
      "Chicken Shawarma Platter - $21.00 | Mixed Shawarma Platter - $22.49 | Baklava Box - $13.99";
    const user = buildPrompt({
      snapshot: JOES,
      customInstructions: notes,
    })[1].content;
    expect(user).toContain(notes);
  });

  it("still produces a prompt when reviews are missing", () => {
    const { reviews: _reviews, ...noReviews } = JOES;
    const messages = buildPrompt({ snapshot: noReviews });
    expect(messages).toHaveLength(2);
    const text = promptText(messages);
    expect(text).toContain("Joe's Pizza");
    expect(text).not.toContain(EXAMPLES_HEADING);
  });

  it("still produces a prompt when reviews are an empty array", () => {
    const messages = buildPrompt({
      snapshot: { ...JOES, reviews: [] },
    });
    expect(messages).toHaveLength(2);
    const text = promptText(messages);
    expect(text).toContain("Joe's Pizza");
    expect(text).not.toContain(EXAMPLES_HEADING);
  });

  it("mentions a 5-star tone when starIntent is omitted", () => {
    const text = promptText(buildPrompt({ snapshot: JOES }));
    expect(text).toMatch(/5[- ]star/i);
  });

  it("asks for food / service / vibe for a restaurant-ish type", () => {
    const text = promptText(buildPrompt({ snapshot: JOES }));
    expect(text).toContain("food");
    expect(text).toContain("service");
    expect(text).toContain("vibe");
  });

  it("asks for quality of work / staff / experience when primaryType is missing", () => {
    const { primaryType: _type, ...noType } = JOES;
    const text = promptText(buildPrompt({ snapshot: noType }));
    expect(text).toContain("quality_of_work");
    expect(text).toContain("staff");
    expect(text).toContain("experience");
  });

  it("places existing review text after the examples heading", () => {
    const text = promptText(buildPrompt({ snapshot: JOES }));
    const quote = "Best pepperoni in the neighborhood.";
    expect(text).toContain(EXAMPLES_HEADING);
    expect(text.indexOf(EXAMPLES_HEADING)).toBeLessThan(text.indexOf(quote));
  });

  it("does not put placeId or writeReviewUrl in the prompt", () => {
    const text = promptText(buildPrompt({ snapshot: JOES }));
    expect(text).not.toContain(JOES.placeId);
    expect(text).not.toContain(JOES.writeReviewUrl);
  });
});

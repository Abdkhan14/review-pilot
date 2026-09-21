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

  it("includes assigned subjects in the user message when assignedItems are provided", () => {
    const user = buildPrompt({
      snapshot: JOES,
      customInstructions: "# Mains\n- Shawarma\n- Mixed Grill\n\n# Sides\n- Hummus",
      assignedItems: [
        { id: "a", name: "Shawarma" },
        { id: "b", name: "Hummus" },
        { id: "c", name: "Mixed Grill" },
      ],
    })[1].content;
    expect(user).toContain("Assigned subjects");
    expect(user).toContain("a: Shawarma");
    expect(user).toContain("b: Hummus");
    expect(user).toContain("c: Mixed Grill");
  });

  it("uses assignment rules in the system message when assignedItems are provided", () => {
    const system = buildPrompt({
      snapshot: JOES,
      assignedItems: [
        { id: "a", name: "Shawarma" },
        { id: "b", name: "Hummus" },
        { id: "c", name: "Mixed Grill" },
      ],
    })[0].content;
    expect(system).toMatch(/assigned subject/i);
    expect(system).not.toMatch(/consecutive generations must not/i);
    expect(system).not.toMatch(/at random from the whole/i);
  });

  it("uses default rules in the system message when no assignedItems are provided", () => {
    const system = buildPrompt({ snapshot: JOES })[0].content;
    expect(system).toMatch(/equal weight/i);
    expect(system).not.toMatch(/assigned subject/i);
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

  it("tells the model not to overweight repeated or distinctive specialties", () => {
    const text = promptText(
      buildPrompt({
        snapshot: JOES,
        customInstructions: "fine line, cover-ups, floral",
      }),
    );
    expect(text).toMatch(/equal weight/i);
    expect(text).toMatch(/most distinctive or most-mentioned specialty/i);
  });

  it("omits example Google reviews when shop notes are present", () => {
    const text = promptText(
      buildPrompt({
        snapshot: JOES,
        customInstructions: "mention the garlic knots",
      }),
    );
    expect(text).not.toContain(EXAMPLES_HEADING);
    expect(text).not.toContain("Best pepperoni in the neighborhood.");
  });

  it("includes example Google reviews when no shop notes are present", () => {
    const text = promptText(buildPrompt({ snapshot: JOES }));
    expect(text).toContain(EXAMPLES_HEADING);
    expect(text).toContain("Best pepperoni in the neighborhood.");
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

  it("picks exactly 3 angles for a restaurant-ish type, all from the restaurant pool", () => {
    const RESTAURANT_POOL = [
      "what you actually ate",
      "how the place felt on a normal visit",
      "whether it hit the craving",
      "the thing you almost didn't order but did",
      "how full you left feeling",
      "the first bite",
      "the sides or extras",
      "the drink or dessert",
      "the smell when you walked in",
      "how the bill felt at the end",
      "how loud or quiet it was",
      "what the regulars seem to know to order",
      "whether it held up as takeout",
      "how fast or slow the food came",
      "the detail that made you want to come back",
      "something you noticed that you didn't expect",
      "what you'd tell someone who'd never been",
      "how it felt to sit there for a while",
      "the thing that was better than it sounds on the menu",
      "whether you'd go back on a weeknight",
      "how the staff read the room",
      "something small that made the meal",
      "what you were in the mood for and whether it delivered",
      "how it felt walking out",
      "the thing you're still thinking about",
    ];
    const text = promptText(buildPrompt({ snapshot: JOES }));
    const matched = RESTAURANT_POOL.filter((a) => text.includes(a));
    expect(matched).toHaveLength(3);
    expect(text).toMatch(/what to pick from shop notes/i);
    for (const label of matched) {
      expect(text).toContain(`${label}:`);
    }
  });

  it("picks exactly 3 angles when primaryType is missing, all from the generic pool", () => {
    const GENERIC_POOL = [
      "how the thing actually turned out",
      "the detail that surprised you",
      "whether they listened to what you actually wanted",
      "how the place felt to be in",
      "how fast or slow the whole thing went",
      "what you'd tell someone before they went",
      "the moment you knew it was the right call",
      "something small they did that you didn't expect",
      "whether it matched what you saw online",
      "how you felt walking out",
      "the thing that would make you go back",
      "whether it solved what you came in for",
      "how easy or hard it was to get going",
      "something they did that went beyond what you asked",
      "the thing that's still on your mind",
      "whether the price felt right after",
      "how quick the turnaround was",
      "the first impression and whether it held",
      "what you'd do differently knowing what you know now",
      "how they handled a question or hiccup",
      "the one thing you'd highlight to a friend",
      "whether the vibe matched the work",
      "how it felt to hand it off or leave",
      "something you noticed that others might miss",
      "whether you'd clear your schedule for it again",
    ];
    const { primaryType: _type, ...noType } = JOES;
    const text = promptText(buildPrompt({ snapshot: noType }));
    const matched = GENERIC_POOL.filter((a) => text.includes(a));
    expect(matched).toHaveLength(3);
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

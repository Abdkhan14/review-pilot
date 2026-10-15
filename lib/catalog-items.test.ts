import { describe, it, expect } from "vitest";
import { parseCatalog, sampleItems, splitItem } from "./catalog-items";

// ─── splitItem ───────────────────────────────────────────────────────────────

describe("splitItem", () => {
  it("returns name only when there are no parentheses", () => {
    const result = splitItem("Chicken Shawarma");
    expect(result.name).toBe("Chicken Shawarma");
    expect(result.description).toBeUndefined();
  });

  it("splits a trailing parenthetical into name and description", () => {
    const result = splitItem("Chicken Saj Arabi Platter (chicken shawarma on saj bread)");
    expect(result.name).toBe("Chicken Saj Arabi Platter");
    expect(result.description).toBe("chicken shawarma on saj bread");
  });

  it("trims surrounding whitespace from name and description", () => {
    const result = splitItem("  Mixed Grill Platter  ( assorted grilled meats )  ");
    expect(result.name).toBe("Mixed Grill Platter");
    expect(result.description).toBe("assorted grilled meats");
  });

  it("falls back to the full string when the name portion is empty", () => {
    const result = splitItem("(just a description)");
    expect(result.name).toBe("(just a description)");
    expect(result.description).toBeUndefined();
  });

  it("falls back to the full string when parentheses contain only whitespace", () => {
    const result = splitItem("Item Name (   )");
    expect(result.name).toBe("Item Name (   )");
    expect(result.description).toBeUndefined();
  });

  it("does not split on mid-string parentheses — only trailing ones", () => {
    // "(combo)" in the middle followed by more text — not a trailing group.
    const result = splitItem("Foo (combo) Platter");
    expect(result.name).toBe("Foo (combo) Platter");
    expect(result.description).toBeUndefined();
  });

  it("handles a simple name with no whitespace before the parenthesis", () => {
    const result = splitItem("Hummus(chickpea dip)");
    expect(result.name).toBe("Hummus");
    expect(result.description).toBe("chickpea dip");
  });
});

// ─── parseCatalog ────────────────────────────────────────────────────────────

describe("parseCatalog", () => {
  it("returns empty prose and no groups for an empty string", () => {
    const result = parseCatalog("");
    expect(result.prose).toBe("");
    expect(result.groups).toHaveLength(0);
  });

  it("treats plain prose with no bullets as prose only", () => {
    const notes = "Always mention the open kitchen.\nDon't talk about wait times.";
    const result = parseCatalog(notes);
    expect(result.prose).toContain("Always mention the open kitchen.");
    expect(result.prose).toContain("Don't talk about wait times.");
    expect(result.groups).toHaveLength(0);
  });

  it("parses dash bullets into an unnamed group", () => {
    const notes = "- Chicken Shawarma\n- Mixed Grill";
    const result = parseCatalog(notes);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].label).toBe("");
    expect(result.groups[0].items).toEqual(["Chicken Shawarma", "Mixed Grill"]);
    expect(result.prose).toBe("");
  });

  it("parses star bullets", () => {
    const notes = "* Hummus\n* Pita";
    const result = parseCatalog(notes);
    expect(result.groups[0].items).toEqual(["Hummus", "Pita"]);
  });

  it("parses bullet (•) bullets", () => {
    const notes = "• Baklava\n• Mint Tea";
    const result = parseCatalog(notes);
    expect(result.groups[0].items).toEqual(["Baklava", "Mint Tea"]);
  });

  it("parses # headings into named groups", () => {
    const notes = "# Mains\n- Shawarma\n\n# Sides\n- Hummus";
    const result = parseCatalog(notes);
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0].label).toBe("Mains");
    expect(result.groups[0].items).toEqual(["Shawarma"]);
    expect(result.groups[1].label).toBe("Sides");
    expect(result.groups[1].items).toEqual(["Hummus"]);
  });

  it("separates prose from grouped items", () => {
    const notes =
      "Always mention the open kitchen.\n\n# Mains\n- Shawarma\n- Mixed Grill\n\n# Sides\n- Hummus";
    const result = parseCatalog(notes);
    expect(result.prose).toContain("Always mention the open kitchen.");
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0].items).toEqual(["Shawarma", "Mixed Grill"]);
    expect(result.groups[1].items).toEqual(["Hummus"]);
  });

  it("drops headings that have no bullet items", () => {
    const notes = "# Empty\n\n# Mains\n- Shawarma";
    const result = parseCatalog(notes);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].label).toBe("Mains");
  });

  it("handles ## headings the same as #", () => {
    const notes = "## Drinks\n- Mint Tea";
    const result = parseCatalog(notes);
    expect(result.groups[0].label).toBe("Drinks");
    expect(result.groups[0].items).toEqual(["Mint Tea"]);
  });

  it("trims trailing whitespace from item names", () => {
    const notes = "- Chicken Shawarma   \n- Mixed Grill\t";
    const result = parseCatalog(notes);
    expect(result.groups[0].items).toEqual(["Chicken Shawarma", "Mixed Grill"]);
  });
});

// ─── sampleItems ─────────────────────────────────────────────────────────────

describe("sampleItems", () => {
  it("returns empty array when catalog has no groups", () => {
    expect(sampleItems({ prose: "Some prose", groups: [] })).toEqual([]);
  });

  it("returns all items when catalog has fewer than 3", () => {
    const catalog = parseCatalog("- Only Item");
    const result = sampleItems(catalog);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Only Item");
  });

  it("returns at most 3 items", () => {
    const notes = "- A\n- B\n- C\n- D\n- E";
    const catalog = parseCatalog(notes);
    expect(sampleItems(catalog)).toHaveLength(3);
  });

  it("returns all items when catalog has exactly 3", () => {
    const notes = "- A\n- B\n- C";
    const catalog = parseCatalog(notes);
    expect(sampleItems(catalog)).toHaveLength(3);
  });

  it("spreads picks across different groups when multiple groups exist", () => {
    // 3 groups, 1 item each — must pick one from each
    const notes = "# G1\n- A\n\n# G2\n- B\n\n# G3\n- C";
    const catalog = parseCatalog(notes);
    const result = sampleItems(catalog);
    expect(result).toHaveLength(3);
    expect(result).toContain("A");
    expect(result).toContain("B");
    expect(result).toContain("C");
  });

  it("does not return duplicate items", () => {
    const notes = "- A\n- B\n- C\n- D\n- E";
    const catalog = parseCatalog(notes);
    const result = sampleItems(catalog);
    expect(new Set(result).size).toBe(result.length);
  });

  it("uses the whole catalog when it is smaller than n", () => {
    const notes = "- X\n- Y";
    const catalog = parseCatalog(notes);
    const result = sampleItems(catalog, 3);
    expect(result).toHaveLength(2);
    expect(result).toContain("X");
    expect(result).toContain("Y");
  });

  it("respects a custom n parameter", () => {
    const notes = "- A\n- B\n- C\n- D\n- E";
    const catalog = parseCatalog(notes);
    expect(sampleItems(catalog, 2)).toHaveLength(2);
  });

  it("returns items from the catalog, not invented ones", () => {
    const validItems = new Set(["Shawarma", "Mixed Grill", "Hummus", "Baklava"]);
    const notes = "- Shawarma\n- Mixed Grill\n- Hummus\n- Baklava";
    const catalog = parseCatalog(notes);
    const result = sampleItems(catalog);
    for (const item of result) {
      expect(validItems.has(item)).toBe(true);
    }
  });
});

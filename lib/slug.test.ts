import { describe, it, expect } from "vitest";
import { makeSlug } from "./slug";

describe("makeSlug", () => {
  it("slugifies Joe's Pizza and appends four hex chars", () => {
    expect(makeSlug("Joe's Pizza")).toMatch(/^joes-pizza-[a-f0-9]{4}$/);
  });

  it("is lowercase with hyphens and no spaces", () => {
    const slug = makeSlug("Joe's Pizza");
    expect(slug).toBe(slug.toLowerCase());
    expect(slug).not.toContain(" ");
  });

  it("gives different slugs for the same name", () => {
    expect(makeSlug("Joe's Pizza")).not.toBe(makeSlug("Joe's Pizza"));
  });

  it("throws when name is empty", () => {
    expect(() => makeSlug("")).toThrow(/name/i);
    expect(() => makeSlug("   ")).toThrow(/name/i);
  });
});

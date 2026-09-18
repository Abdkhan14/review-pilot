import { describe, it, expect } from "vitest";
import { parseUpdateBusinessInput } from "./update-business-input";

describe("parseUpdateBusinessInput", () => {
  it("accepts a valid BASIC tier body", () => {
    const result = parseUpdateBusinessInput({ tier: "BASIC" });
    expect(result).toEqual({ ok: true, input: { tier: "BASIC" } });
  });

  it("accepts a valid SAAS tier body", () => {
    const result = parseUpdateBusinessInput({ tier: "SAAS" });
    expect(result).toEqual({ ok: true, input: { tier: "SAAS" } });
  });

  it("accepts customInstructions when provided", () => {
    const result = parseUpdateBusinessInput({
      tier: "BASIC",
      customInstructions: "mention the garlic knots",
    });
    expect(result).toEqual({
      ok: true,
      input: { tier: "BASIC", customInstructions: "mention the garlic knots" },
    });
  });

  it("converts empty-string customInstructions to null", () => {
    const result = parseUpdateBusinessInput({ tier: "SAAS", customInstructions: "" });
    expect(result).toEqual({ ok: true, input: { tier: "SAAS", customInstructions: null } });
  });

  it("converts null customInstructions to null", () => {
    const result = parseUpdateBusinessInput({ tier: "BASIC", customInstructions: null });
    expect(result).toEqual({ ok: true, input: { tier: "BASIC", customInstructions: null } });
  });

  it("returns error for missing tier", () => {
    const result = parseUpdateBusinessInput({ customInstructions: "notes" });
    expect(result).toEqual({ ok: false, error: 'tier must be "BASIC" or "SAAS"' });
  });

  it("returns error for invalid tier value", () => {
    const result = parseUpdateBusinessInput({ tier: "PRO" });
    expect(result).toEqual({ ok: false, error: 'tier must be "BASIC" or "SAAS"' });
  });

  it("returns error when body is not an object", () => {
    expect(parseUpdateBusinessInput(null)).toEqual({
      ok: false,
      error: "body must be a JSON object",
    });
    expect(parseUpdateBusinessInput("string")).toEqual({
      ok: false,
      error: "body must be a JSON object",
    });
    expect(parseUpdateBusinessInput([])).toEqual({
      ok: false,
      error: "body must be a JSON object",
    });
  });

  it("drops slug / name / placeId if the client sends them", () => {
    const result = parseUpdateBusinessInput({
      tier: "BASIC",
      slug: "injected-slug",
      name: "Hacked Name",
      placeId: "ChIJhack",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input).not.toHaveProperty("slug");
      expect(result.input).not.toHaveProperty("name");
      expect(result.input).not.toHaveProperty("placeId");
    }
  });
});

import { describe, it, expect } from "vitest";
import { parseCreateBusinessInput } from "./create-business-input";

describe("parseCreateBusinessInput", () => {
  it("fails for null body", () => {
    const r = parseCreateBusinessInput(null);
    expect(r.ok).toBe(false);
  });

  it("fails for a non-object body", () => {
    const r = parseCreateBusinessInput("not-an-object");
    expect(r.ok).toBe(false);
  });

  it("fails when name is missing", () => {
    const r = parseCreateBusinessInput({ placeId: "ChIJ123", tier: "BASIC" });
    expect(r.ok).toBe(false);
  });

  it("fails when name is an empty string", () => {
    const r = parseCreateBusinessInput({ name: "", placeId: "ChIJ123", tier: "BASIC" });
    expect(r.ok).toBe(false);
  });

  it("fails when name is whitespace only", () => {
    const r = parseCreateBusinessInput({ name: "   ", placeId: "ChIJ123", tier: "BASIC" });
    expect(r.ok).toBe(false);
  });

  it("fails when placeId is missing", () => {
    const r = parseCreateBusinessInput({ name: "Joe's Pizza", tier: "BASIC" });
    expect(r.ok).toBe(false);
  });

  it("fails when placeId is an empty string", () => {
    const r = parseCreateBusinessInput({ name: "Joe's Pizza", placeId: "", tier: "BASIC" });
    expect(r.ok).toBe(false);
  });

  it("fails when tier is missing", () => {
    const r = parseCreateBusinessInput({ name: "Joe's Pizza", placeId: "ChIJ123" });
    expect(r.ok).toBe(false);
  });

  it("fails when tier is an invalid value", () => {
    const r = parseCreateBusinessInput({ name: "Joe's Pizza", placeId: "ChIJ123", tier: "PRO" });
    expect(r.ok).toBe(false);
  });

  it("parses a valid BASIC business", () => {
    const r = parseCreateBusinessInput({ name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.input).toEqual({ name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" });
    }
  });

  it("parses a valid SAAS business with customInstructions", () => {
    const r = parseCreateBusinessInput({
      name: "Joe's Pizza",
      placeId: "ChIJ123",
      tier: "SAAS",
      customInstructions: "mention the garlic knots",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.input.customInstructions).toBe("mention the garlic knots");
    }
  });

  it("omits customInstructions when it is whitespace only", () => {
    const r = parseCreateBusinessInput({
      name: "Joe's Pizza",
      placeId: "ChIJ123",
      tier: "BASIC",
      customInstructions: "   ",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.input).not.toHaveProperty("customInstructions");
    }
  });

  it("does not include slug even if the client sends one", () => {
    const r = parseCreateBusinessInput({
      name: "Joe's Pizza",
      placeId: "ChIJ123",
      tier: "BASIC",
      slug: "client-slug",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.input).not.toHaveProperty("slug");
    }
  });
});

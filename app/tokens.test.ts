import { describe, it, expect } from "vitest";
import { tokens, layoutClass } from "./tokens";

describe("tokens", () => {
  it("background is bg-zinc-50", () => {
    expect(tokens.background).toBe("bg-zinc-50");
  });

  it("text is text-zinc-900", () => {
    expect(tokens.text).toBe("text-zinc-900");
  });

  it("border is border-zinc-200", () => {
    expect(tokens.border).toBe("border-zinc-200");
  });

  it("maxWidth is max-w-md", () => {
    expect(tokens.maxWidth).toBe("max-w-md");
  });
});

describe("layoutClass", () => {
  it("body includes background and text tokens", () => {
    expect(layoutClass.body).toContain(tokens.background);
    expect(layoutClass.body).toContain(tokens.text);
  });

  it("column includes maxWidth and border tokens", () => {
    expect(layoutClass.column).toContain(tokens.maxWidth);
    expect(layoutClass.column).toContain(tokens.border);
  });

  it("neither class uses rounded-*", () => {
    expect(layoutClass.body).not.toMatch(/rounded/);
    expect(layoutClass.column).not.toMatch(/rounded/);
  });
});

import { describe, it, expect } from "vitest";
import { buildHumanizePrompt, type HumanizeContext } from "./humanize-prompt";

const BASE_CTX: HumanizeContext = {
  shopName: "Joe's Pizza",
  starIntent: 5,
  voiceInstruction: "Voice: Be direct and factual.",
  lengthInstruction: "Length: Write 2-3 sentences.",
};

describe("buildHumanizePrompt", () => {
  it("returns exactly two messages — system then user", () => {
    const msgs = buildHumanizePrompt("Great pizza.", BASE_CTX);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("system");
    expect(msgs[1].role).toBe("user");
  });

  it("puts the draft text in the user message", () => {
    const msgs = buildHumanizePrompt("The crust was good.", BASE_CTX);
    expect(msgs[1].content).toBe("The crust was good.");
  });

  it("includes the voice instruction in the system message", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    expect(msgs[0].content).toContain("Voice: Be direct and factual.");
  });

  it("includes the length instruction in the system message", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    expect(msgs[0].content).toContain("Length: Write 2-3 sentences.");
  });

  it("includes the shop name in the system message", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    expect(msgs[0].content).toContain("Joe's Pizza");
  });

  it("includes the assigned item line when assignedItem is provided", () => {
    const ctx = { ...BASE_CTX, assignedItem: "Greek Souvlaki" };
    const msgs = buildHumanizePrompt("Draft.", ctx);
    expect(msgs[0].content).toContain("Greek Souvlaki");
  });

  it("omits the assigned item line when no assignedItem", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    // BASE_CTX has no assignedItem — no item preservation line should appear
    expect(msgs[0].content).not.toContain("assigned item");
  });

  it("asks for JSON { text } output shape", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    expect(msgs[0].content).toContain('"text"');
    expect(msgs[0].content).toContain("JSON");
  });

  it("includes the star intent in the system message", () => {
    const ctx = { ...BASE_CTX, starIntent: 4 };
    const msgs = buildHumanizePrompt("Draft.", ctx);
    expect(msgs[0].content).toContain("4-star");
  });
});

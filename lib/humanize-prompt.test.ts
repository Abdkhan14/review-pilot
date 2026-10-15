import { describe, it, expect } from "vitest";
import { buildHumanizePrompt, type HumanizeContext } from "./humanize-prompt";
import EXAMPLES from "./recipes/humanize-examples.json";

const BASE_CTX: HumanizeContext = {
  shopName: "Joe's Pizza",
  starIntent: 5,
  voiceInstruction: "Voice: Be direct and factual.",
  lengthInstruction: "Length: Write 2-3 sentences.",
};

// With the new structure: system + 10 example pairs (20 turns) + 1 final user = 22 messages.
const EXAMPLE_COUNT = EXAMPLES.length; // 10
const TOTAL_MESSAGES = 1 + EXAMPLE_COUNT * 2 + 1; // 22

describe("buildHumanizePrompt", () => {
  // ─── Message structure ──────────────────────────────────────────────────────

  it("returns the right number of messages: system + example pairs + final user", () => {
    const msgs = buildHumanizePrompt("Great pizza.", BASE_CTX);
    expect(msgs).toHaveLength(TOTAL_MESSAGES);
  });

  it("first message is the system message", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    expect(msgs[0].role).toBe("system");
  });

  it("example turns follow the system message and alternate user/assistant", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    // Messages 1..10 are the 5 example pairs.
    for (let i = 0; i < EXAMPLE_COUNT; i++) {
      expect(msgs[1 + i * 2].role).toBe("user");
      expect(msgs[2 + i * 2].role).toBe("assistant");
    }
  });

  it("last message is a user message containing the draft text", () => {
    const msgs = buildHumanizePrompt("The crust was good.", BASE_CTX);
    const last = msgs[msgs.length - 1];
    expect(last.role).toBe("user");
    expect(last.content).toContain("The crust was good.");
  });

  // ─── Static prefix (cache friendliness) ────────────────────────────────────

  it("all messages except the last are identical for different contexts", () => {
    const msgsA = buildHumanizePrompt("Draft A.", BASE_CTX);
    const msgsB = buildHumanizePrompt("Draft B.", {
      ...BASE_CTX,
      shopName: "Other Shop",
      assignedItem: "Shawarma",
      starIntent: 4,
    });
    const prefixA = msgsA.slice(0, -1);
    const prefixB = msgsB.slice(0, -1);
    expect(prefixA).toEqual(prefixB);
  });

  // ─── System message content ─────────────────────────────────────────────────

  it("system message includes the full Tier 1 vocabulary list", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toContain("delve");
    expect(sys).toContain("tapestry");
    expect(sys).toContain("paradigm shift");
    expect(sys).toContain("leverage");
    expect(sys).toContain("myriad");
    expect(sys).toContain("streamline");
  });

  it("system message includes Tier 2 vocabulary list", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toContain("seamless");
    expect(sys).toContain("nuanced");
    expect(sys).toContain("transformative");
    expect(sys).toContain("unprecedented");
  });

  it("system message includes significance inflation words", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toContain("testament");
    expect(sys).toContain("pivotal");
    expect(sys).toContain("nestled");
    expect(sys).toContain("showcasing");
  });

  it("system message includes the generation ban list", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toContain("highly recommend");
    expect(sys).toContain("I appreciated");
    expect(sys).toContain("paired with");
  });

  it("system message names the voice-wins-over-soul conflict rule", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toContain("Voice instruction overrides Pass 8");
  });

  it("system message includes the JSON output format with issues field", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toContain('"issues"');
    expect(sys).toContain('"text"');
    expect(sys).toContain("JSON");
  });

  // ─── Final user message content ─────────────────────────────────────────────

  it("final user message includes the voice instruction", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    expect(msgs[msgs.length - 1].content).toContain("Voice: Be direct and factual.");
  });

  it("final user message includes the length instruction", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    expect(msgs[msgs.length - 1].content).toContain("Length: Write 2-3 sentences.");
  });

  it("final user message includes the shop name", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    expect(msgs[msgs.length - 1].content).toContain("Joe's Pizza");
  });

  it("final user message includes the star intent", () => {
    const msgs = buildHumanizePrompt("Draft.", { ...BASE_CTX, starIntent: 4 });
    expect(msgs[msgs.length - 1].content).toContain("Stars: 4");
  });

  it("final user message includes the assigned item when provided", () => {
    const ctx = { ...BASE_CTX, assignedItem: "Greek Souvlaki" };
    const msgs = buildHumanizePrompt("Draft.", ctx);
    expect(msgs[msgs.length - 1].content).toContain("Greek Souvlaki");
  });

  it("final user message omits the item line when no assignedItem", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    expect(msgs[msgs.length - 1].content).not.toContain("Item:");
  });

  // ─── Example turns validity ─────────────────────────────────────────────────

  it("every example assistant turn parses as valid JSON with a non-empty text field", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    for (let i = 0; i < EXAMPLE_COUNT; i++) {
      const assistantMsg = msgs[2 + i * 2];
      expect(assistantMsg.role).toBe("assistant");
      const parsed = JSON.parse(assistantMsg.content) as { issues: string[]; text: string };
      expect(typeof parsed.text).toBe("string");
      expect(parsed.text.trim().length).toBeGreaterThan(0);
    }
  });

  it("no example assistant text contains an exclamation mark or em dash", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    for (let i = 0; i < EXAMPLE_COUNT; i++) {
      const parsed = JSON.parse(msgs[2 + i * 2].content) as { text: string };
      expect(parsed.text).not.toContain("!");
      expect(parsed.text).not.toContain("—");
    }
  });

  it("the unchanged example has an empty issues array and identical text", () => {
    // The fifth example (Corner Bakery) in the JSON is the 'already human' one.
    const cornerBakery = EXAMPLES.find((e) => e.draft === e.text);
    expect(cornerBakery).toBeDefined();
    expect(cornerBakery!.issues).toHaveLength(0);
  });

  // ─── Verdict pass in system message ────────────────────────────────────────

  it("system message includes the verdict and critic words pass", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toContain("Verdict and critic words");
  });

  it("system message includes verdict grade words to replace", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toContain("satisfying");
    expect(sys).toContain("inviting");
    expect(sys).toContain("appealing");
  });

  it("system message includes the aroma plain-speech swap", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toContain("aroma");
    expect(sys).toContain("smell");
  });

  it("system message includes the The/They consecutive-opener rule", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toContain("The");
    expect(sys).toContain("They");
    expect(sys).toContain("two consecutive sentences");
  });

  // ─── No verdict words in example outputs ────────────────────────────────────

  it("no example assistant text contains 'satisfying'", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    for (let i = 0; i < EXAMPLE_COUNT; i++) {
      const parsed = JSON.parse(msgs[2 + i * 2].content) as { text: string };
      expect(parsed.text.toLowerCase()).not.toContain("satisfying");
    }
  });

  it("no example assistant text contains 'vibrant'", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    for (let i = 0; i < EXAMPLE_COUNT; i++) {
      const parsed = JSON.parse(msgs[2 + i * 2].content) as { text: string };
      expect(parsed.text.toLowerCase()).not.toContain("vibrant");
    }
  });

  it("no example assistant text contains 'inviting' (as verdict adjective)", () => {
    const msgs = buildHumanizePrompt("Draft.", BASE_CTX);
    for (let i = 0; i < EXAMPLE_COUNT; i++) {
      const parsed = JSON.parse(msgs[2 + i * 2].content) as { text: string };
      expect(parsed.text.toLowerCase()).not.toContain("inviting");
    }
  });

  // ─── Readout rule ────────────────────────────────────────────────────────────

  it("system message includes the readout draft rule", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toMatch(/readout draft/i);
    expect(sys).toContain("what an item contains or came with");
  });

  it("system message includes the voice-override exception for readouts", () => {
    const sys = buildHumanizePrompt("Draft.", BASE_CTX)[0].content;
    expect(sys).toMatch(/readout.*must be converted even under no-opinion voices/i);
  });

  it("the readout example has a single issue about menu readout", () => {
    const readoutEx = EXAMPLES.find((e) =>
      e.draft.includes("had chicken shawarma on saj bread"),
    );
    expect(readoutEx).toBeDefined();
    expect(readoutEx!.issues).toHaveLength(1);
    expect(readoutEx!.issues[0]).toMatch(/menu readout/i);
  });

  it("the readout example output keeps the item name and includes an experienced reaction", () => {
    const readoutEx = EXAMPLES.find((e) =>
      e.draft.includes("had chicken shawarma on saj bread"),
    );
    expect(readoutEx!.text).toContain("Chicken Saj Arabi Platter");
    // The output must contain something experienced — not a menu description
    expect(readoutEx!.text).not.toContain("shawarma on saj bread");
  });
});

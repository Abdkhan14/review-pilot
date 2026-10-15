import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Hoist the mock function so it is accessible inside vi.mock factory.
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: mockCreate } } };
  }),
}));

import { generateDrafts, GenerationError, type DraftSlot } from "./generate-drafts";
import type { HumanizeContext } from "./humanize-prompt";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Per-call JSON shape for a generated draft. */
function draftJson(id: string, angle: string, text: string): string {
  return JSON.stringify({ id, angle, text });
}

/** Per-call JSON shape returned by the humanize editor pass. */
function editJson(text: string): string {
  return JSON.stringify({ text });
}

const DRAFT_A = draftJson("a", "food", "Great pizza!");
const DRAFT_B = draftJson("b", "service", "Friendly staff.");
const DRAFT_C = draftJson("c", "vibe", "Lovely atmosphere.");

const EDIT_A = editJson("Great pizza.");
const EDIT_B = editJson("Friendly staff.");
const EDIT_C = editJson("Lovely atmosphere.");

const EDIT_CTX: HumanizeContext = {
  shopName: "Joe's Pizza",
  starIntent: 5,
  voiceInstruction: "Voice: Be direct and factual.",
  lengthInstruction: "Length: Write 2-3 sentences.",
};

/** generateDrafts now accepts an array of { messages, edit } slots. */
const SLOTS: DraftSlot[] = [
  {
    messages: [{ role: "system" as const, content: "Draft a." }, { role: "user" as const, content: "Shop" }],
    edit: EDIT_CTX,
  },
  {
    messages: [{ role: "system" as const, content: "Draft b." }, { role: "user" as const, content: "Shop" }],
    edit: EDIT_CTX,
  },
  {
    messages: [{ role: "system" as const, content: "Draft c." }, { role: "user" as const, content: "Shop" }],
    edit: EDIT_CTX,
  },
];

function stubCreates(...payloads: string[]) {
  for (const p of payloads) {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: p } }] });
  }
}

describe("generateDrafts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.DRAFT_EDIT_PASS;
    delete process.env.OPENAI_EDIT_MODEL;
  });

  // ─── Core generation ────────────────────────────────────────────────────────

  it("returns three DraftReview objects, one per slot", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    const drafts = await generateDrafts(SLOTS);
    expect(drafts).toHaveLength(3);
    expect(drafts[0]).toMatchObject({ id: "a", angle: "food" });
    expect(drafts[1]).toMatchObject({ id: "b", angle: "service" });
    expect(drafts[2]).toMatchObject({ id: "c", angle: "vibe" });
  });

  it("makes 6 API calls total — 3 generate then 3 edit", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    await generateDrafts(SLOTS);
    expect(mockCreate).toHaveBeenCalledTimes(6);
  });

  it("passes the correct messages to each generate call", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    await generateDrafts(SLOTS);
    expect(mockCreate.mock.calls[0][0].messages).toEqual(SLOTS[0].messages);
    expect(mockCreate.mock.calls[1][0].messages).toEqual(SLOTS[1].messages);
    expect(mockCreate.mock.calls[2][0].messages).toEqual(SLOTS[2].messages);
  });

  it("passes the generated draft text in the last message of the edit call", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    await generateDrafts(SLOTS);
    // Edit call for slot 0 is call index 3. The last message is the per-draft user message.
    const messages = mockCreate.mock.calls[3][0].messages;
    const lastMsg = messages[messages.length - 1];
    expect(lastMsg.role).toBe("user");
    expect(lastMsg.content).toContain("Great pizza!");
  });

  it("returns the edited text when the edit call succeeds", async () => {
    stubCreates(
      DRAFT_A, DRAFT_B, DRAFT_C,
      editJson("Good pizza."), EDIT_B, EDIT_C,
    );
    const drafts = await generateDrafts(SLOTS);
    expect(drafts[0].text).toBe("Good pizza.");
  });

  it("returns edited text when the edit response includes an issues field", async () => {
    const editWithIssues = JSON.stringify({ issues: ["filler: 'due to'"], text: "Good pizza." });
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, editWithIssues, EDIT_B, EDIT_C);
    const drafts = await generateDrafts(SLOTS);
    expect(drafts[0].text).toBe("Good pizza.");
  });

  it("throws GenerationError when one draft returns malformed JSON", async () => {
    stubCreates("not json £££", DRAFT_B, DRAFT_C);
    await expect(generateDrafts(SLOTS)).rejects.toBeInstanceOf(GenerationError);
  });

  it("does not include the garbage payload in the GenerationError message", async () => {
    const garbage = "not json £££";
    stubCreates(garbage, DRAFT_B, DRAFT_C);
    const err = await generateDrafts(SLOTS).catch((e) => e);
    expect(err).toBeInstanceOf(GenerationError);
    expect(err.message).not.toContain(garbage);
  });

  it("throws GenerationError when a draft is missing required fields", async () => {
    stubCreates(JSON.stringify({ something: "else" }), DRAFT_B, DRAFT_C);
    await expect(generateDrafts(SLOTS)).rejects.toBeInstanceOf(GenerationError);
  });

  it("throws when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(generateDrafts(SLOTS)).rejects.toThrow(/OPENAI_API_KEY/);
  });

  it("uses gpt-4.1-nano by default when OPENAI_MODEL is unset", async () => {
    delete process.env.OPENAI_MODEL;
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    await generateDrafts(SLOTS);
    // All 6 calls (generate + edit) should use the default model.
    for (const call of mockCreate.mock.calls) {
      expect(call[0]).toMatchObject({ model: "gpt-4.1-nano" });
    }
  });

  it("sets frequency_penalty and presence_penalty on generate calls", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    await generateDrafts(SLOTS);
    // Only the first 3 calls are generate calls.
    for (const call of mockCreate.mock.calls.slice(0, 3)) {
      expect(call[0]).toMatchObject({ frequency_penalty: 0.5, presence_penalty: 0.3 });
    }
  });

  it("uses temperature 0.4 for edit calls", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    await generateDrafts(SLOTS);
    for (const call of mockCreate.mock.calls.slice(3)) {
      expect(call[0]).toMatchObject({ temperature: 0.4 });
    }
  });

  it("uses OPENAI_EDIT_MODEL for the edit call when set", async () => {
    process.env.OPENAI_MODEL = "gpt-4.1-nano";
    process.env.OPENAI_EDIT_MODEL = "gpt-4.1-mini";
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    await generateDrafts(SLOTS);
    for (const call of mockCreate.mock.calls.slice(0, 3)) {
      expect(call[0]).toMatchObject({ model: "gpt-4.1-nano" });
    }
    for (const call of mockCreate.mock.calls.slice(3)) {
      expect(call[0]).toMatchObject({ model: "gpt-4.1-mini" });
    }
  });

  // ─── Edit pass fallbacks ────────────────────────────────────────────────────

  it("falls back to the original when the edit call throws", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C);
    // Edit calls will get undefined (mock exhausted) → TypeError thrown → caught → fallback.
    const drafts = await generateDrafts(SLOTS);
    expect(drafts[0].text).toBe("Great pizza!");
  });

  it("falls back to the original when the edit returns non-JSON", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, "not json at all", EDIT_B, EDIT_C);
    const drafts = await generateDrafts(SLOTS);
    expect(drafts[0].text).toBe("Great pizza!"); // original, not edited
    expect(drafts[1].text).toBe("Friendly staff.");
  });

  it("falls back to the original when the edit returns more than 3 sentences", async () => {
    const tooLong = editJson("Sentence one. Sentence two. Sentence three. Sentence four.");
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, tooLong, EDIT_B, EDIT_C);
    const drafts = await generateDrafts(SLOTS);
    expect(drafts[0].text).toBe("Great pizza!");
  });

  it("falls back to original when the edit drops the assigned item", async () => {
    const slotWithItem: DraftSlot = {
      messages: SLOTS[0].messages,
      edit: { ...EDIT_CTX, assignedItem: "Souvlaki" },
    };
    const draftWithItem = draftJson("a", "food", "The Souvlaki was great.");
    const editWithoutItem = editJson("It was great.");

    stubCreates(
      draftWithItem, DRAFT_B, DRAFT_C,
      editWithoutItem, EDIT_B, EDIT_C,
    );

    const drafts = await generateDrafts([slotWithItem, SLOTS[1], SLOTS[2]]);
    expect(drafts[0].text).toBe("The Souvlaki was great."); // fell back
  });

  it("does not fall back when the original lacked the assigned item and the edit also lacks it", async () => {
    const slotWithItem: DraftSlot = {
      messages: SLOTS[0].messages,
      edit: { ...EDIT_CTX, assignedItem: "Souvlaki" },
    };
    // Original draft does NOT mention the item.
    const draftWithoutItem = draftJson("a", "food", "The food was great.");
    const editAlsoWithout = editJson("Great food.");

    stubCreates(
      draftWithoutItem, DRAFT_B, DRAFT_C,
      editAlsoWithout, EDIT_B, EDIT_C,
    );

    const drafts = await generateDrafts([slotWithItem, SLOTS[1], SLOTS[2]]);
    expect(drafts[0].text).toBe("Great food."); // edit accepted — item wasn't in original either
  });

  // ─── Kill switch ────────────────────────────────────────────────────────────

  it("skips the edit pass and makes only 3 calls when DRAFT_EDIT_PASS=off", async () => {
    process.env.DRAFT_EDIT_PASS = "off";
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C);
    const drafts = await generateDrafts(SLOTS);
    expect(mockCreate).toHaveBeenCalledTimes(3);
    expect(drafts[0].text).toBe("Great pizza!");
  });
});

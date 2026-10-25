import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Hoist mock primitives so they are accessible inside vi.mock factory (which is
// itself hoisted to the top of the file by Vitest before any imports run).
const mockCreate = vi.hoisted(() => vi.fn());

// Minimal NotFoundError matching the real SDK shape (status 404, code model_not_found).
// Must be hoisted for the same reason as mockCreate.
const NotFoundError = vi.hoisted(() => {
  return class NotFoundError extends Error {
    status = 404;
    code = "model_not_found";
    constructor(msg = "The model `x` has been deprecated") {
      super(msg);
      this.name = "NotFoundError";
    }
  };
});

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: mockCreate } } };
  }),
  NotFoundError,
}));

import { generateDrafts, GenerationError, _resetDeadModels, type DraftSlot } from "./generate-drafts";
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
    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_FALLBACK_MODELS;
    _resetDeadModels();
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

  it("uses gpt-5.6-luna by default when OPENAI_MODEL is unset", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    await generateDrafts(SLOTS);
    // All 6 calls (generate + edit) should use the default model.
    for (const call of mockCreate.mock.calls) {
      expect(call[0]).toMatchObject({ model: "gpt-5.6-luna" });
    }
  });

  it("sets frequency_penalty and presence_penalty on generate calls", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    await generateDrafts(SLOTS);
    // Only the first 3 calls are generate calls.
    for (const call of mockCreate.mock.calls.slice(0, 3)) {
      expect(call[0]).toMatchObject({ frequency_penalty: 0.5, presence_penalty: 0.3, reasoning_effort: "none" });
    }
  });

  it("uses temperature 0.4 for edit calls", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    await generateDrafts(SLOTS);
    for (const call of mockCreate.mock.calls.slice(3)) {
      expect(call[0]).toMatchObject({ temperature: 0.4, reasoning_effort: "none" });
    }
  });

  it("uses OPENAI_MODEL for both generate and edit calls", async () => {
    process.env.OPENAI_MODEL = "gpt-custom";
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
    await generateDrafts(SLOTS);
    expect(mockCreate).toHaveBeenCalledTimes(6);
    for (const call of mockCreate.mock.calls) {
      expect(call[0]).toMatchObject({ model: "gpt-custom" });
    }
  });

  // ─── Model fallback chain ──────────────────────────────────────────────────

  it("falls back to the next model when the primary returns NotFoundError", async () => {
    process.env.OPENAI_MODEL = "gpt-retired";
    process.env.DRAFT_EDIT_PASS = "off";
    // All 3 parallel primary calls fail with 404; all 3 fallback calls succeed.
    mockCreate
      .mockRejectedValueOnce(new NotFoundError())
      .mockRejectedValueOnce(new NotFoundError())
      .mockRejectedValueOnce(new NotFoundError())
      .mockResolvedValueOnce({ choices: [{ message: { content: DRAFT_A } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: DRAFT_B } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: DRAFT_C } }] });
    const drafts = await generateDrafts(SLOTS);
    expect(drafts).toHaveLength(3);
    // 3 failed primary attempts + 3 successful fallback calls.
    expect(mockCreate).toHaveBeenCalledTimes(6);
    // With OPENAI_FALLBACK_MODELS unset, the default fallback is gpt-5.4-mini.
    const fallbackCalls = mockCreate.mock.calls.slice(3);
    for (const call of fallbackCalls) {
      expect(call[0].model).toBe("gpt-5.4-mini");
    }
  });

  it("throws GenerationError when all models in the chain return NotFoundError", async () => {
    process.env.OPENAI_MODEL = "gpt-retired-a";
    process.env.OPENAI_FALLBACK_MODELS = "gpt-retired-b";
    process.env.DRAFT_EDIT_PASS = "off";
    mockCreate.mockRejectedValue(new NotFoundError());
    await expect(generateDrafts(SLOTS)).rejects.toBeInstanceOf(GenerationError);
  });

  it("rethrows immediately on non-404 errors without trying fallbacks", async () => {
    process.env.DRAFT_EDIT_PASS = "off";
    const networkErr = new Error("network failure");
    // Use mockRejectedValue (not Once) so all 3 parallel generate calls see it.
    mockCreate.mockRejectedValue(networkErr);
    await expect(generateDrafts(SLOTS)).rejects.toBe(networkErr);
    // Every call used the primary model — no fallback model was attempted.
    for (const call of mockCreate.mock.calls) {
      expect(call[0].model).toBe("gpt-5.6-luna");
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

  // ─── Debug logging ────────────────────────────────────────────────────────────

  it("logs a [humanize] line to console.info when DRAFT_EDIT_DEBUG=1 and the edit succeeds", async () => {
    process.env.DRAFT_EDIT_DEBUG = "1";
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, editJson("Good pizza."), EDIT_B, EDIT_C);
      await generateDrafts(SLOTS);
      const humanizeCalls = infoSpy.mock.calls.filter((c) => String(c[0]).includes("[humanize]"));
      expect(humanizeCalls.length).toBeGreaterThan(0);
    } finally {
      infoSpy.mockRestore();
      delete process.env.DRAFT_EDIT_DEBUG;
    }
  });

  it("does not call console.info when DRAFT_EDIT_DEBUG is not set", async () => {
    delete process.env.DRAFT_EDIT_DEBUG;
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      stubCreates(DRAFT_A, DRAFT_B, DRAFT_C, EDIT_A, EDIT_B, EDIT_C);
      await generateDrafts(SLOTS);
      expect(infoSpy).not.toHaveBeenCalled();
    } finally {
      infoSpy.mockRestore();
    }
  });
});

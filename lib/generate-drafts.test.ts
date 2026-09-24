import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Hoist the mock function so it is accessible inside vi.mock factory.
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: mockCreate } } };
  }),
}));

import { generateDrafts, GenerationError } from "./generate-drafts";

// Per-call JSON shape: a single draft object (not a "reviews" array).
function draftJson(id: string, angle: string, text: string): string {
  return JSON.stringify({ id, angle, text });
}

const DRAFT_A = draftJson("a", "food", "Great pizza!");
const DRAFT_B = draftJson("b", "service", "Friendly staff.");
const DRAFT_C = draftJson("c", "vibe", "Lovely atmosphere.");

// generateDrafts now accepts an array of message arrays (one per draft).
const MESSAGES_LIST = [
  [{ role: "system" as const, content: "Draft a." }, { role: "user" as const, content: "Shop" }],
  [{ role: "system" as const, content: "Draft b." }, { role: "user" as const, content: "Shop" }],
  [{ role: "system" as const, content: "Draft c." }, { role: "user" as const, content: "Shop" }],
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
  });

  it("returns three DraftReview objects, one per messages array", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C);
    const drafts = await generateDrafts(MESSAGES_LIST);
    expect(drafts).toHaveLength(3);
    expect(drafts[0]).toMatchObject({ id: "a", angle: "food", text: "Great pizza!" });
    expect(drafts[1]).toMatchObject({ id: "b", angle: "service" });
    expect(drafts[2]).toMatchObject({ id: "c", angle: "vibe" });
  });

  it("makes exactly 3 API calls — one per messages array", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C);
    await generateDrafts(MESSAGES_LIST);
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });

  it("passes the correct messages to each API call", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C);
    await generateDrafts(MESSAGES_LIST);
    expect(mockCreate.mock.calls[0][0].messages).toEqual(MESSAGES_LIST[0]);
    expect(mockCreate.mock.calls[1][0].messages).toEqual(MESSAGES_LIST[1]);
    expect(mockCreate.mock.calls[2][0].messages).toEqual(MESSAGES_LIST[2]);
  });

  it("throws GenerationError when one draft returns malformed JSON", async () => {
    stubCreates("not json £££", DRAFT_B, DRAFT_C);
    await expect(generateDrafts(MESSAGES_LIST)).rejects.toBeInstanceOf(GenerationError);
  });

  it("does not include the garbage payload in the GenerationError message", async () => {
    const garbage = "not json £££";
    stubCreates(garbage, DRAFT_B, DRAFT_C);
    const err = await generateDrafts(MESSAGES_LIST).catch((e) => e);
    expect(err).toBeInstanceOf(GenerationError);
    expect(err.message).not.toContain(garbage);
  });

  it("throws GenerationError when a draft is missing required fields", async () => {
    stubCreates(JSON.stringify({ something: "else" }), DRAFT_B, DRAFT_C);
    await expect(generateDrafts(MESSAGES_LIST)).rejects.toBeInstanceOf(GenerationError);
  });

  it("throws when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(generateDrafts(MESSAGES_LIST)).rejects.toThrow(/OPENAI_API_KEY/);
  });

  it("uses gpt-4.1-nano by default when OPENAI_MODEL is unset", async () => {
    delete process.env.OPENAI_MODEL;
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C);
    await generateDrafts(MESSAGES_LIST);
    for (const call of mockCreate.mock.calls) {
      expect(call[0]).toMatchObject({ model: "gpt-4.1-nano" });
    }
  });

  it("sets frequency_penalty and presence_penalty on each call", async () => {
    stubCreates(DRAFT_A, DRAFT_B, DRAFT_C);
    await generateDrafts(MESSAGES_LIST);
    for (const call of mockCreate.mock.calls) {
      expect(call[0]).toMatchObject({ frequency_penalty: 0.5, presence_penalty: 0.3 });
    }
  });
});

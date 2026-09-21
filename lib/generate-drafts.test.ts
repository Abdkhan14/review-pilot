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

function stubCreate(content: string) {
  mockCreate.mockResolvedValueOnce({
    choices: [{ message: { content } }],
  });
}

const THREE_DRAFTS = JSON.stringify({
  reviews: [
    { id: "a", angle: "food", text: "Great pizza!" },
    { id: "b", angle: "service", text: "Friendly staff." },
    { id: "c", angle: "vibe", text: "Lovely atmosphere." },
  ],
});

const MESSAGES = [
  { role: "system" as const, content: "You write reviews." },
  { role: "user" as const, content: "Shop: Joe's Pizza" },
];

describe("generateDrafts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns three DraftReview objects from a mocked SDK response", async () => {
    stubCreate(THREE_DRAFTS);
    const drafts = await generateDrafts(MESSAGES);
    expect(drafts).toHaveLength(3);
    expect(drafts[0]).toMatchObject({ id: "a", angle: "food", text: "Great pizza!" });
    expect(drafts[1]).toMatchObject({ id: "b", angle: "service" });
    expect(drafts[2]).toMatchObject({ id: "c", angle: "vibe" });
  });

  it("throws GenerationError when the model returns malformed JSON", async () => {
    stubCreate("not json at all £££");
    await expect(generateDrafts(MESSAGES)).rejects.toBeInstanceOf(GenerationError);
  });

  it("does not include the garbage payload in the GenerationError message", async () => {
    const garbage = "not json at all £££";
    stubCreate(garbage);
    const err = await generateDrafts(MESSAGES).catch((e) => e);
    expect(err).toBeInstanceOf(GenerationError);
    expect(err.message).not.toContain(garbage);
  });

  it("throws GenerationError when reviews array is missing", async () => {
    stubCreate(JSON.stringify({ something: "else" }));
    await expect(generateDrafts(MESSAGES)).rejects.toBeInstanceOf(GenerationError);
  });

  it("throws GenerationError when fewer than three reviews are returned", async () => {
    stubCreate(
      JSON.stringify({
        reviews: [{ id: "a", angle: "food", text: "Only one." }],
      }),
    );
    await expect(generateDrafts(MESSAGES)).rejects.toBeInstanceOf(GenerationError);
  });

  it("throws when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(generateDrafts(MESSAGES)).rejects.toThrow(/OPENAI_API_KEY/);
  });

  it("uses gpt-4.1-nano by default when OPENAI_MODEL is unset", async () => {
    delete process.env.OPENAI_MODEL;
    stubCreate(THREE_DRAFTS);
    await generateDrafts(MESSAGES);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4.1-nano" })
    );
  });
});

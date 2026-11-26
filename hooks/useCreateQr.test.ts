/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("./api", () => ({ api: { post: vi.fn() } }));

import { api } from "./api";
import { useCreateQr } from "./useCreateQr";

const mockPost = vi.mocked(api.post);
const input = { placeId: "ChIJ_joes", notes: "", plan: "trial" as const, sessionToken: "tok" };

describe("useCreateQr", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the new QR", async () => {
    mockPost.mockResolvedValue({ data: { id: "biz_1", slug: "joes-ab12" } });
    const { result } = renderHook(() => useCreateQr());
    let created;
    await act(async () => {
      created = await result.current.createQr(input);
    });
    expect(mockPost).toHaveBeenCalledWith("/api/app/qr", input);
    expect(created).toEqual({ id: "biz_1", slug: "joes-ab12" });
  });

  it("reports trial_used when the account already had its trial", async () => {
    mockPost.mockRejectedValue({ response: { status: 409, data: { error: "trial_used" } } });
    const { result } = renderHook(() => useCreateQr());
    await act(async () => {
      await result.current.createQr(input);
    });
    expect(result.current.error).toBe("trial_used");
  });
});

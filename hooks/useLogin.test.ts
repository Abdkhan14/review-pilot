/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("./api", () => ({ api: { post: vi.fn() } }));

import { api } from "./api";
import { useLogin } from "./useLogin";

const mockPost = vi.mocked(api.post);

describe("useLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("posts to /api/auth/login with the password", async () => {
    mockPost.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login("my-secret");
    });

    expect(mockPost).toHaveBeenCalledWith("/api/auth/login", {
      password: "my-secret",
    });
  });

  it("returns true on success", async () => {
    mockPost.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useLogin());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.login("correct");
    });

    expect(success).toBe(true);
  });

  it("returns false and sets error on 401", async () => {
    mockPost.mockRejectedValue({
      response: { data: { error: "Invalid password" } },
    });
    const { result } = renderHook(() => useLogin());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.login("wrong");
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Invalid password");
  });

  it("falls back to generic error message when error body is absent", async () => {
    mockPost.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login("any");
    });

    expect(result.current.error).toBe("Something went wrong");
  });

  it("sets loading true while in flight then false after", async () => {
    let resolve!: () => void;
    mockPost.mockReturnValue(new Promise((r) => (resolve = () => r({ data: {} }))));

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.login("pw");
    });

    expect(result.current.loading).toBe(true);

    await act(async () => resolve());

    expect(result.current.loading).toBe(false);
  });
});

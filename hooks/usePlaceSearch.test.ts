/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";

vi.mock("@/hooks/api", () => ({ api: { post: vi.fn() } }));

import { usePlaceSearch, type PlaceSuggestion } from "./usePlaceSearch";
import { api } from "@/hooks/api";

const mockPost = vi.mocked(api.post);

const PLACE: PlaceSuggestion = {
  placeId: "ChIJabc",
  name: "Joe's Pizza",
  address: "214 Mulberry St",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mockPost.mockResolvedValue({ data: { places: [PLACE] } });
});

describe("usePlaceSearch", () => {
  it("does not search when query is shorter than 2 chars", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePlaceSearch());
    act(() => { result.current.setQuery("J"); });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(mockPost).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe("idle");
    vi.useRealTimers();
  });

  it("searches after 250ms debounce and returns results", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePlaceSearch());
    act(() => { result.current.setQuery("Joe"); });
    // Not called yet at 200ms
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(mockPost).not.toHaveBeenCalled();
    // Called after 250ms
    await act(() => vi.advanceTimersByTimeAsync(50));
    expect(mockPost).toHaveBeenCalledOnce();
    expect(result.current.state).toMatchObject({ status: "results", places: [PLACE] });
    vi.useRealTimers();
  });

  it("clearing the query cancels a pending search", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePlaceSearch());
    act(() => { result.current.setQuery("Joe"); });
    await act(() => vi.advanceTimersByTimeAsync(200));
    act(() => { result.current.setQuery(""); });
    await act(() => vi.advanceTimersByTimeAsync(500));

    expect(mockPost).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe("idle");
    vi.useRealTimers();
  });

  it("keeps the session token across searches and changes it after reset()", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePlaceSearch());
    const tokenBefore = result.current.sessionToken;

    act(() => { result.current.setQuery("Joe"); });
    await act(() => vi.advanceTimersByTimeAsync(250));
    act(() => { result.current.setQuery(""); });
    expect(result.current.sessionToken).toBe(tokenBefore);

    act(() => { result.current.reset(); });
    expect(result.current.sessionToken).not.toBe(tokenBefore);
    vi.useRealTimers();
  });

  it("drops a stale response when query changes before it arrives", async () => {
    vi.useFakeTimers();
    let resolveFirst!: (v: unknown) => void;
    // First call hangs
    mockPost
      .mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }))
      .mockResolvedValue({ data: { places: [PLACE] } });

    const { result } = renderHook(() => usePlaceSearch());
    act(() => { result.current.setQuery("Jo"); });
    await act(() => vi.advanceTimersByTimeAsync(250));

    // Before the first promise resolves, type more
    act(() => { result.current.setQuery("Joe's"); });
    await act(() => vi.advanceTimersByTimeAsync(250));

    // Now resolve the stale first call
    act(() => { resolveFirst({ data: { places: [] } }); });
    await act(() => vi.advanceTimersByTimeAsync(10));

    // State should reflect the second (live) call, not the stale one
    expect(result.current.state).toMatchObject({ status: "results", places: [PLACE] });
    vi.useRealTimers();
  });
});

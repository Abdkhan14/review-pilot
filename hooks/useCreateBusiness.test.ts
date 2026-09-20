/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("./api", () => ({ api: { post: vi.fn() } }));

import { api } from "./api";
import { useCreateBusiness } from "./useCreateBusiness";

const mockPost = vi.mocked(api.post);

const input = {
  name: "Joe's Pizza",
  placeId: "ChIJ123",
  tier: "BASIC" as const,
};

describe("useCreateBusiness", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls api.post with the four-field body", async () => {
    mockPost.mockResolvedValue({ data: { slug: "joes-pizza-ab12" } });
    const { result } = renderHook(() => useCreateBusiness());

    await act(async () => {
      await result.current.createBusiness(input);
    });

    expect(mockPost).toHaveBeenCalledWith("/api/admin/businesses", input);
  });

  it("sets data on 201 success", async () => {
    mockPost.mockResolvedValue({ data: { slug: "joes-pizza-ab12" } });
    const { result } = renderHook(() => useCreateBusiness());

    await act(async () => {
      await result.current.createBusiness(input);
    });

    expect(result.current.data).toEqual({ slug: "joes-pizza-ab12" });
    expect(result.current.error).toBeNull();
  });

  it("sets error on 400/401 failure", async () => {
    mockPost.mockRejectedValue({
      response: { data: { error: "name is required and must be a non-empty string" } },
    });
    const { result } = renderHook(() => useCreateBusiness());

    await act(async () => {
      await result.current.createBusiness(input);
    });

    expect(result.current.error).toBe("name is required and must be a non-empty string");
    expect(result.current.data).toBeNull();
  });

  it("sets loading false after call completes", async () => {
    mockPost.mockResolvedValue({ data: { slug: "joes-pizza-ab12" } });
    const { result } = renderHook(() => useCreateBusiness());

    await act(async () => {
      await result.current.createBusiness(input);
    });

    expect(result.current.loading).toBe(false);
  });
});

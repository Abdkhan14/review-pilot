/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("./api", () => ({ api: { patch: vi.fn() } }));

import { api } from "./api";
import { useUpdateBusiness } from "./useUpdateBusiness";

const mockPatch = vi.mocked(api.patch);

const id = "cuid-abc123";
const input = { tier: "SAAS" as const, customInstructions: "try the garlic knots" };

describe("useUpdateBusiness", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls api.patch with the correct url and input", async () => {
    mockPatch.mockResolvedValue({ data: { slug: "joes-pizza-ab12", tier: "SAAS" } });
    const { result } = renderHook(() => useUpdateBusiness());

    await act(async () => {
      await result.current.updateBusiness(id, input);
    });

    expect(mockPatch).toHaveBeenCalledWith(
      `/api/admin/businesses/${id}`,
      input
    );
  });

  it("sets data on success", async () => {
    mockPatch.mockResolvedValue({ data: { slug: "joes-pizza-ab12", tier: "SAAS" } });
    const { result } = renderHook(() => useUpdateBusiness());

    await act(async () => {
      await result.current.updateBusiness(id, input);
    });

    expect(result.current.data).toEqual({ slug: "joes-pizza-ab12", tier: "SAAS" });
    expect(result.current.error).toBeNull();
  });

  it("sets error on 400/401 failure", async () => {
    mockPatch.mockRejectedValue({
      response: { data: { error: 'tier must be "BASIC" or "SAAS"' } },
    });
    const { result } = renderHook(() => useUpdateBusiness());

    await act(async () => {
      await result.current.updateBusiness(id, input);
    });

    expect(result.current.error).toBe('tier must be "BASIC" or "SAAS"');
    expect(result.current.data).toBeNull();
  });

  it("sets loading false after the call completes", async () => {
    mockPatch.mockResolvedValue({ data: { slug: "joes-pizza-ab12", tier: "SAAS" } });
    const { result } = renderHook(() => useUpdateBusiness());

    await act(async () => {
      await result.current.updateBusiness(id, input);
    });

    expect(result.current.loading).toBe(false);
  });
});

/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import DeleteBusinessButton from "./DeleteBusinessButton";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockDeleteBusiness = vi.fn();
vi.mock("@/hooks/useDeleteBusiness", () => ({
  useDeleteBusiness: () => ({
    deleteBusiness: mockDeleteBusiness,
    loading: false,
    error: null,
  }),
}));

describe("DeleteBusinessButton", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it("does not call deleteBusiness when confirm is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteBusinessButton id="cuid-abc123" />);

    fireEvent.click(screen.getByRole("button", { name: /delete business/i }));

    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    expect(mockDeleteBusiness).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("calls deleteBusiness and redirects to /admin when confirm is accepted", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockDeleteBusiness.mockResolvedValue(true);
    render(<DeleteBusinessButton id="cuid-abc123" />);

    fireEvent.click(screen.getByRole("button", { name: /delete business/i }));

    await waitFor(() => expect(mockDeleteBusiness).toHaveBeenCalledWith("cuid-abc123"));
    expect(mockPush).toHaveBeenCalledWith("/admin");
  });
});

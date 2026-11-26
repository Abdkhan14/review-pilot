/// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockUpdateQr = vi.fn();
vi.mock("@/hooks/useUpdateQr", () => ({ useUpdateQr: () => ({ updateQr: mockUpdateQr, loading: false }) }));

import { toast } from "sonner";
import { ShopNotesCard } from "./ShopNotesCard";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderCard = () =>
  render(<ShopNotesCard id="biz_1" initialNotes="Old notes" detailsFetchedAt="2026-11-02T10:00:00.000Z" />);

describe("ShopNotesCard", () => {
  it("only enables Save once the notes change, then saves them", async () => {
    mockUpdateQr.mockResolvedValue({ customInstructions: "Try the knots", detailsFetchedAt: null });
    renderCard();
    const save = screen.getByRole("button", { name: /save notes/i });
    expect(save).toHaveProperty("disabled", true);

    fireEvent.change(screen.getByLabelText("Shop notes"), { target: { value: "Try the knots" } });
    fireEvent.click(save);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Shop notes saved"));
    expect(mockUpdateQr).toHaveBeenCalledWith({ customInstructions: "Try the knots" });
  });

  it("refreshes Google info and shows the new date", async () => {
    mockUpdateQr.mockResolvedValue({ customInstructions: "Old notes", detailsFetchedAt: "2026-11-27T09:00:00.000Z" });
    renderCard();
    expect(screen.getByText(/google info saved nov 2/i)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /refresh google info/i }));

    await waitFor(() => expect(screen.getByText(/google info saved nov 27/i)).toBeDefined());
    expect(mockUpdateQr).toHaveBeenCalledWith({ refreshPlace: true });
  });
});

/// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush, refresh: vi.fn() }) }));
const mockDeleteQr = vi.fn();
vi.mock("@/hooks/useDeleteQr", () => ({ useDeleteQr: () => ({ deleteQr: mockDeleteQr, loading: false }) }));

import { DeleteQr } from "./DeleteQr";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function openDialog() {
  render(<DeleteQr id="biz_1" name="Joe's Pizza" consequence="Your trial isn't given back." />);
  fireEvent.click(screen.getByRole("button", { name: /delete qr…/i }));
  return screen.getByRole("button", { name: /^delete qr$/i });
}

describe("DeleteQr", () => {
  it("keeps Delete disabled until the shop name is typed", () => {
    const confirm = openDialog();
    expect(confirm).toHaveProperty("disabled", true);
    fireEvent.change(screen.getByLabelText(/type joe's pizza to confirm/i), { target: { value: "joe's" } });
    expect(confirm).toHaveProperty("disabled", true);
    fireEvent.change(screen.getByLabelText(/type joe's pizza to confirm/i), { target: { value: "JOE'S PIZZA" } });
    expect(confirm).toHaveProperty("disabled", false);
  });

  it("deletes and returns to the QR list", async () => {
    mockDeleteQr.mockResolvedValue(true);
    const confirm = openDialog();
    fireEvent.change(screen.getByLabelText(/type joe's pizza to confirm/i), { target: { value: "Joe's Pizza" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/app"));
    expect(mockDeleteQr).toHaveBeenCalledTimes(1);
  });
});

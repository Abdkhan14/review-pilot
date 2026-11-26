/// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/hooks/usePlaceSearch", () => ({ usePlaceSearch: vi.fn() }));
vi.mock("@/hooks/useCreateQr", () => ({ useCreateQr: vi.fn() }));

import { usePlaceSearch } from "@/hooks/usePlaceSearch";
import { useCreateQr } from "@/hooks/useCreateQr";
import { NewQrForm } from "./NewQrForm";

const mockCreateQr = vi.fn();
const LIMITS = { trialGenerations: 5, trialHandoffs: 2, assistedDailyHandoffs: 6 };
const JOES = { placeId: "ChIJ_joes", name: "Joe's Pizza", address: "214 Mulberry St" };

beforeEach(() => {
  vi.mocked(usePlaceSearch).mockReturnValue({
    query: "joe",
    setQuery: vi.fn(),
    state: { status: "results", places: [JOES] },
    sessionToken: "tok",
    reset: vi.fn(),
  });
  vi.mocked(useCreateQr).mockReturnValue({ createQr: mockCreateQr, loading: false, error: null });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const submit = () => fireEvent.click(screen.getByRole("button", { name: /create qr and start trial/i }));

describe("NewQrForm", () => {
  it("asks for a shop before creating anything", () => {
    render(<NewQrForm trialUse={null} limits={LIMITS} />);
    submit();
    expect(screen.getByText("Pick your shop from the list.")).toBeDefined();
    expect(mockCreateQr).not.toHaveBeenCalled();
  });

  it("creates a trial QR for the picked shop and opens it", async () => {
    mockCreateQr.mockResolvedValue({ id: "biz_1", slug: "joes-ab12" });
    render(<NewQrForm trialUse={null} limits={LIMITS} />);

    fireEvent.mouseDown(screen.getByRole("option", { name: /joe's pizza/i }));
    fireEvent.change(screen.getByLabelText("Shop notes"), { target: { value: "Try the knots" } });
    submit();

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/app/qr/biz_1"));
    expect(mockCreateQr).toHaveBeenCalledWith({
      placeId: "ChIJ_joes",
      notes: "Try the knots",
      plan: "trial",
      sessionToken: "tok",
    });
  });

  it("disables the trial once the account has used it", () => {
    render(<NewQrForm trialUse={{ date: "Nov 2", qrName: "Joe's Pizza" }} limits={LIMITS} />);
    expect(screen.getByRole("radio", { name: /free trial/i })).toHaveProperty("disabled", true);
    expect(screen.getByText("You used your free trial on Joe's Pizza on Nov 2.")).toBeDefined();
    expect(screen.getByRole("button", { name: /create qr and start trial/i })).toHaveProperty("disabled", true);
  });

  it("shows Basic and Assisted as not yet available", () => {
    render(<NewQrForm trialUse={null} limits={LIMITS} />);
    expect(screen.getByRole("radio", { name: /basic/i })).toHaveProperty("disabled", true);
    expect(screen.getByRole("radio", { name: /assisted/i })).toHaveProperty("disabled", true);
  });
});

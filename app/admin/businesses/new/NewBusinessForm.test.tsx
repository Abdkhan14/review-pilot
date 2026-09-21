/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import NewBusinessForm from "./NewBusinessForm";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockCreateBusiness = vi.fn();
vi.mock("@/hooks/useCreateBusiness", () => ({
  useCreateBusiness: () => ({
    createBusiness: mockCreateBusiness,
    data: null,
    loading: false,
    error: null,
  }),
}));

describe("NewBusinessForm", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  function fillForm({
    name = "Joe's Pizza",
    placeId = "ChIJ123",
    tier = "BASIC",
  } = {}) {
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: name } });
    fireEvent.change(screen.getByLabelText(/place id/i), { target: { value: placeId } });
    fireEvent.change(screen.getByLabelText(/^tier$/i), { target: { value: tier } });
  }

  it("submits the four fields to createBusiness", async () => {
    mockCreateBusiness.mockResolvedValue({ slug: "joes-pizza-ab12" });
    render(<NewBusinessForm />);

    fillForm();
    fireEvent.change(screen.getByLabelText(/shop notes/i), {
      target: { value: "mention the garlic knots" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create business/i }));

    await waitFor(() =>
      expect(mockCreateBusiness).toHaveBeenCalledWith({
        name: "Joe's Pizza",
        placeId: "ChIJ123",
        tier: "BASIC",
        customInstructions: "mention the garlic knots",
      })
    );
  });

  it("shows validation messages on missing required fields without calling createBusiness", async () => {
    render(<NewBusinessForm />);

    fireEvent.click(screen.getByRole("button", { name: /create business/i }));

    await waitFor(() => screen.getByRole("alert"));
    expect(mockCreateBusiness).not.toHaveBeenCalled();
  });

  it("redirects to /admin when createBusiness returns a slug", async () => {
    mockCreateBusiness.mockResolvedValue({ slug: "joes-pizza-ab12" });
    render(<NewBusinessForm />);

    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /create business/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin"));
  });

  it("does not redirect when createBusiness returns null", async () => {
    mockCreateBusiness.mockResolvedValue(null);
    render(<NewBusinessForm />);

    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /create business/i }));

    await waitFor(() => expect(mockCreateBusiness).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });
});

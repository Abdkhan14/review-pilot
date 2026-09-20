/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import EditBusinessForm from "./EditBusinessForm";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUpdateBusiness = vi.fn();
vi.mock("@/hooks/useUpdateBusiness", () => ({
  useUpdateBusiness: () => ({
    updateBusiness: mockUpdateBusiness,
    data: null,
    loading: false,
    error: null,
  }),
}));

const defaultProps = {
  id: "cuid-abc123",
  name: "Joe's Pizza",
  slug: "joes-pizza-ab12",
  initialTier: "BASIC" as const,
  initialCustomInstructions: null,
};

describe("EditBusinessForm", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it("shows name and slug as read-only text", () => {
    render(<EditBusinessForm {...defaultProps} />);
    expect(screen.getByText("Joe's Pizza")).toBeDefined();
    expect(screen.getByText("joes-pizza-ab12")).toBeDefined();
    // They are NOT inputs
    expect(screen.queryByDisplayValue("Joe's Pizza")).toBeNull();
    expect(screen.queryByDisplayValue("joes-pizza-ab12")).toBeNull();
  });

  it("submits tier and customInstructions to updateBusiness", async () => {
    mockUpdateBusiness.mockResolvedValue({ slug: "joes-pizza-ab12", tier: "SAAS" });
    render(<EditBusinessForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/^tier$/i), { target: { value: "SAAS" } });
    fireEvent.change(screen.getByLabelText(/custom instructions/i), {
      target: { value: "mention the garlic knots" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(mockUpdateBusiness).toHaveBeenCalledWith("cuid-abc123", {
        tier: "SAAS",
        customInstructions: "mention the garlic knots",
      })
    );
  });

  it("shows validation alert and does not call updateBusiness when tier is missing", async () => {
    render(<EditBusinessForm {...defaultProps} initialTier={"" as any} />);

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => screen.getByRole("alert"));
    expect(mockUpdateBusiness).not.toHaveBeenCalled();
  });

  it("redirects to /admin when updateBusiness returns a result", async () => {
    mockUpdateBusiness.mockResolvedValue({ slug: "joes-pizza-ab12", tier: "SAAS" });
    render(<EditBusinessForm {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin"));
  });

  it("does not redirect when updateBusiness returns null", async () => {
    mockUpdateBusiness.mockResolvedValue(null);
    render(<EditBusinessForm {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(mockUpdateBusiness).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("prefills tier with initialTier", () => {
    render(
      <EditBusinessForm
        {...defaultProps}
        initialTier="SAAS"
        initialCustomInstructions="some notes"
      />
    );
    const select = screen.getByLabelText(/^tier$/i) as HTMLSelectElement;
    expect(select.value).toBe("SAAS");

    const textarea = screen.getByLabelText(/custom instructions/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe("some notes");
  });
});

/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import LoginForm from "./LoginForm";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => cleanup());

  it("calls /api/auth/login with the password on submit", async () => {
    mockFetch.mockResolvedValue({ status: 200 });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "my-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ password: "my-secret" }),
        })
      )
    );
  });

  it("shows error message on 401 and does not redirect", async () => {
    mockFetch.mockResolvedValue({ status: 401 });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    // getByRole throws if the element is absent — that is the assertion
    await waitFor(() => screen.getByRole("alert"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to /admin on success", async () => {
    mockFetch.mockResolvedValue({ status: 200 });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "correct" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin"));
  });
});

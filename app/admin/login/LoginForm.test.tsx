/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import LoginForm from "./LoginForm";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/hooks/api", () => ({ api: { post: vi.fn() } }));

import { api } from "@/hooks/api";
const mockPost = vi.mocked(api.post);

describe("LoginForm", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it("calls /api/auth/login with the password on submit", async () => {
    mockPost.mockResolvedValue({ data: {} });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "my-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/api/auth/login", {
        password: "my-secret",
      })
    );
  });

  it("shows error message on failure and does not redirect", async () => {
    mockPost.mockRejectedValue({
      response: { data: { error: "Invalid password" } },
    });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => screen.getByRole("alert"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to /admin on success", async () => {
    mockPost.mockResolvedValue({ data: {} });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "correct" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin"));
  });
});

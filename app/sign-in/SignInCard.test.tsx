/// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { social: vi.fn() } },
}));

import { authClient } from "@/lib/auth-client";
import { SignInCard, type SignInState } from "./SignInCard";

const mockSocial = vi.mocked(authClient.signIn.social);

afterEach(() => {
  cleanup();
  mockSocial.mockReset();
});

describe("SignInCard", () => {
  it.each<[SignInState, RegExp]>([
    ["default", /^sign in$/i],
    ["failed", /^sign in$/i],
    ["closed", /sign-ups open soon/i],
    ["banned", /this account is blocked/i],
  ])("shows the %s state", (state, heading) => {
    render(<SignInCard state={state} callbackURL="/app" />);
    expect(screen.getByRole("heading", { name: heading })).toBeDefined();
  });

  it("only offers Google sign-in when sign-in can work", () => {
    render(<SignInCard state="closed" callbackURL="/app" />);
    expect(screen.queryByRole("button", { name: /continue with google/i })).toBeNull();
    expect(screen.getByRole("button", { name: /contact us/i })).toBeDefined();
  });

  it("shows the failure alert in the failed state", () => {
    render(<SignInCard state="failed" callbackURL="/app" />);
    expect(screen.getByRole("alert").textContent).toMatch(/didn.t finish/i);
  });

  it("starts Google sign-in and comes back to /sign-in on error", async () => {
    mockSocial.mockReturnValue(new Promise(() => {}) as never);
    render(<SignInCard state="default" callbackURL="/admin" />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    expect(mockSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/admin",
      errorCallbackURL: "/sign-in?callbackURL=%2Fadmin",
    });
    expect(screen.getByRole("button", { name: /opening google/i })).toHaveProperty("disabled", true);
  });

  it("shows the failure alert when Google sign-in cannot start", async () => {
    mockSocial.mockResolvedValue({ data: null, error: { message: "boom" } } as never);
    render(<SignInCard state="default" callbackURL="/app" />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeDefined();
  });
});

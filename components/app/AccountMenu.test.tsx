/// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut: vi.fn() } }));

import { authClient } from "@/lib/auth-client";
import { AccountMenu } from "./AccountMenu";

const mockSignOut = vi.mocked(authClient.signOut);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function openMenu() {
  render(<AccountMenu name="Maria Lopez" email="maria@joespizza.com" />);
  fireEvent.keyDown(screen.getByRole("button", { name: /maria lopez/i }), { key: "Enter" });
}

describe("AccountMenu", () => {
  it("shows the initials and name on the trigger", () => {
    render(<AccountMenu name="Maria Lopez" email="maria@joespizza.com" />);
    expect(screen.getByRole("button").textContent).toBe("MLMaria Lopez");
  });

  it("shows the email once opened", () => {
    openMenu();
    expect(screen.getByText("maria@joespizza.com")).toBeDefined();
  });

  it("signs out and returns to the home page", () => {
    mockSignOut.mockImplementation((async (opts: { fetchOptions: { onSuccess: () => void } }) =>
      opts.fetchOptions.onSuccess()) as never);
    openMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});

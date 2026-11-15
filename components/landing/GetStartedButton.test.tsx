/// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { GetStartedButton } from "./GetStartedButton";

afterEach(() => cleanup());

describe("GetStartedButton", () => {
  it("renders a /sign-in link when selfServe is true", () => {
    render(<GetStartedButton selfServe />);
    const link = screen.getByRole("link", { name: /get started/i });
    expect((link as HTMLAnchorElement).href).toMatch(/\/sign-in/);
  });

  it("opens the contact sheet when selfServe is false", () => {
    render(<GetStartedButton selfServe={false} />);
    const btn = screen.getByRole("button", { name: /get started/i });
    fireEvent.click(btn);
    expect(screen.getByText(/get in touch/i)).toBeDefined();
  });

  it("closes the contact sheet on Escape", () => {
    render(<GetStartedButton selfServe={false} />);
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(screen.getByText(/get in touch/i)).toBeDefined();
    fireEvent.keyDown(document.body, { key: "Escape", code: "Escape" });
    expect(screen.queryByText(/get in touch/i)).toBeNull();
  });
});

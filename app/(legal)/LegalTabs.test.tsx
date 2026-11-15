/// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { LegalTabs } from "./LegalTabs";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/terms"),
}));

afterEach(() => cleanup());

describe("LegalTabs", () => {
  it("renders Terms and Privacy links", () => {
    render(<LegalTabs />);
    expect(screen.getByRole("link", { name: /terms/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /privacy/i })).toBeDefined();
  });

  it("marks the active tab with a visible border", () => {
    render(<LegalTabs />);
    const termsLink = screen.getByRole("link", { name: /terms of service/i }) as HTMLAnchorElement;
    expect(termsLink.className).toContain("border-zinc-900");
  });
});

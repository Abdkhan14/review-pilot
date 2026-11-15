/// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { animate } from "framer-motion";
import { SmoothScroll } from "./SmoothScroll";

vi.mock("framer-motion", () => ({ animate: vi.fn(() => ({ stop: vi.fn() })) }));

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia;
}

function renderPage() {
  render(
    <>
      <SmoothScroll />
      <a href="#pricing">Pricing</a>
      <section id="pricing" />
    </>,
  );
}

beforeEach(() => {
  vi.mocked(animate).mockClear();
  window.scrollTo = vi.fn();
});
afterEach(() => cleanup());

describe("SmoothScroll", () => {
  it("animates to the target section and updates the hash", () => {
    setReducedMotion(false);
    renderPage();
    fireEvent.click(screen.getByRole("link", { name: "Pricing" }));
    expect(animate).toHaveBeenCalledOnce();
    expect(window.location.hash).toBe("#pricing");
  });

  it("jumps without animating when the user prefers reduced motion", () => {
    setReducedMotion(true);
    renderPage();
    fireEvent.click(screen.getByRole("link", { name: "Pricing" }));
    expect(animate).not.toHaveBeenCalled();
    expect(window.scrollTo).toHaveBeenCalled();
  });
});

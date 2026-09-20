/// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, describe, it, vi } from "vitest";

// next/font/google is a Next.js build-time transform — stub it for jsdom
vi.mock("next/font/google", () => ({
  Instrument_Sans: () => ({ className: "mock-font" }),
}));

import Home from "./page";

describe("Home", () => {
  it("renders the hero heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        name: /google reviews without the awkward ask/i,
      })
    ).toBeDefined();
  });

  it("renders the how-it-works illustration with descriptive alt text", () => {
    render(<Home />);
    const imgs = screen.getAllByAltText(
      "Three steps: scan a QR code, pick a review, paste it on Google Reviews."
    );
    expect(imgs.length).toBeGreaterThan(0);
  });

  it("renders the Review Pilot wordmark", () => {
    render(<Home />);
    const matches = screen.getAllByText("Review Pilot");
    expect(matches.length).toBeGreaterThan(0);
  });
});

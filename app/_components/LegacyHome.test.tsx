/// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, describe, it } from "vitest";
import { LegacyHome } from "./LegacyHome";

describe("LegacyHome", () => {
  it("renders the hero heading", () => {
    render(<LegacyHome />);
    expect(
      screen.getByRole("heading", {
        name: /google reviews, minus the hard part/i,
      })
    ).toBeDefined();
  });

  it("renders the how-it-works illustration with descriptive alt text", () => {
    render(<LegacyHome />);
    const imgs = screen.getAllByAltText(
      "Three steps: scan a QR code, pick a review, paste it on Google Reviews."
    );
    expect(imgs.length).toBeGreaterThan(0);
  });

  it("renders the Review Pilot wordmark", () => {
    render(<LegacyHome />);
    const matches = screen.getAllByText("Review Pilot");
    expect(matches.length).toBeGreaterThan(0);
  });
});

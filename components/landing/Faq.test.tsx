/// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { Faq } from "./Faq";

afterEach(() => cleanup());

describe("Faq", () => {
  it("renders at least 5 FAQ entries", () => {
    render(<Faq />);
    const triggers = screen.getAllByRole("button");
    expect(triggers.length).toBeGreaterThanOrEqual(5);
  });

  it("renders the section heading", () => {
    render(<Faq />);
    expect(screen.getByRole("heading", { name: /questions owners ask/i })).toBeDefined();
  });
});

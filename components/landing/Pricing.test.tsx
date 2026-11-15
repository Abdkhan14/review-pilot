/// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { Pricing } from "./Pricing";

afterEach(() => cleanup());

describe("Pricing", () => {
  it("renders three pricing cards", () => {
    render(<Pricing />);
    expect(screen.getByText("Trial")).toBeDefined();
    expect(screen.getByText("Basic")).toBeDefined();
    expect(screen.getByText("Assisted")).toBeDefined();
  });

  it("shows the correct prices", () => {
    render(<Pricing />);
    expect(screen.getByText("Free")).toBeDefined();
    expect(screen.getByText("$20")).toBeDefined();
    expect(screen.getByText("$5")).toBeDefined();
  });

  it("renders a CTA button for each card", () => {
    render(<Pricing />);
    expect(screen.getByText(/start free trial/i)).toBeDefined();
    expect(screen.getByText(/get basic/i)).toBeDefined();
    expect(screen.getByText(/get assisted/i)).toBeDefined();
  });
});

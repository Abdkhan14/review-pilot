/// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import NotFound from "./not-found";

afterEach(() => cleanup());

describe("NotFound", () => {
  it("renders a heading", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading").textContent).toMatch(/business not found/i);
  });

  it("renders descriptive copy", () => {
    render(<NotFound />);
    expect(screen.getByText(/couldn't find this business/i)).toBeDefined();
  });

  it("applies the zinc text token class", () => {
    const { container } = render(<NotFound />);
    const main = container.querySelector("main");
    expect(main?.className).toContain("text-zinc-900");
  });

  it("does not use any rounded-* classes", () => {
    const { container } = render(<NotFound />);
    expect(container.innerHTML).not.toMatch(/rounded/);
  });
});

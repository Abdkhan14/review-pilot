/// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StarRow } from "./StarRow";

afterEach(() => cleanup());

describe("StarRow", () => {
  it("renders five star characters", () => {
    render(<StarRow />);
    const el = screen.getByLabelText("5 stars");
    expect(el.textContent).toBe("★★★★★");
  });

  it("has aria-label '5 stars'", () => {
    render(<StarRow />);
    expect(screen.getByLabelText("5 stars")).toBeDefined();
  });
});

/// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DraftCard } from "./DraftCard";

afterEach(() => cleanup());

describe("DraftCard", () => {
  it("renders the draft text", () => {
    render(<DraftCard text="Great pizza, loved the garlic knots!" />);
    expect(
      screen.getByText("Great pizza, loved the garlic knots!"),
    ).toBeDefined();
  });

  it("renders five stars via StarRow", () => {
    render(<DraftCard text="Good service." />);
    expect(screen.getByLabelText("5 stars").textContent).toBe("★★★★★");
  });
});

/// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { DraftCard } from "./DraftCard";

const writeText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, { clipboard: { writeText } });

beforeEach(() => {
  writeText.mockClear();
  cleanup();
});

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

  it("clicking the draft text copies it", async () => {
    render(<DraftCard text="Great pizza, loved the garlic knots!" />);
    fireEvent.click(screen.getByText("Great pizza, loved the garlic knots!"));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "Great pizza, loved the garlic knots!",
      ),
    );
  });

  it("calls onCopy after a successful copy", async () => {
    const onCopy = vi.fn();
    render(<DraftCard text="Great pizza!" onCopy={onCopy} />);
    fireEvent.click(screen.getByRole("button", { name: /copy review/i }));
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
  });

  it("shows Copied aria-label when copied=true", () => {
    render(<DraftCard text="x" copied />);
    expect(screen.getByRole("button", { name: /copied/i })).toBeDefined();
  });

  it("does not call onCopy when clipboard.writeText rejects", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    const onCopy = vi.fn();
    render(<DraftCard text="x" onCopy={onCopy} />);
    fireEvent.click(screen.getByRole("button", { name: /copy review/i }));
    await new Promise((r) => setTimeout(r, 50));
    expect(onCopy).not.toHaveBeenCalled();
  });
});

/// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

beforeEach(() => cleanup());
import { GenerateProgress } from "./DraftsSkeleton";
import { GENERATE_STEPS } from "@/lib/generate-progress";

describe("GenerateProgress", () => {
  it("renders all five steps", () => {
    render(<GenerateProgress />);
    for (const step of GENERATE_STEPS) {
      expect(screen.getByText(step)).toBeDefined();
    }
  });

  it("marks step 0 as active and steps 1-4 as upcoming by default", () => {
    const { container } = render(<GenerateProgress activeIndex={0} />);
    const items = container.querySelectorAll("li");
    expect(items[0].className).toContain("text-zinc-900");
    expect(items[1].className).toContain("text-zinc-300");
    expect(items[4].className).toContain("text-zinc-300");
  });

  it("marks completed steps as done and the next as active", () => {
    const { container } = render(<GenerateProgress activeIndex={2} />);
    const items = container.querySelectorAll("li");
    expect(items[0].className).toContain("text-zinc-400"); // done
    expect(items[1].className).toContain("text-zinc-400"); // done
    expect(items[2].className).toContain("text-zinc-900"); // active
    expect(items[3].className).toContain("text-zinc-300"); // upcoming
  });

  it("sets the progress bar width from progressPct", () => {
    const { container } = render(<GenerateProgress progressPct={60} />);
    const bar = container.querySelector<HTMLElement>("[style]");
    expect(bar?.style.width).toBe("60%");
  });

  it("exposes data-testid for integration tests", () => {
    render(<GenerateProgress />);
    expect(screen.getByTestId("generate-progress")).toBeDefined();
  });

  it("hides the Oops message and Regenerate button when slow is not set", () => {
    render(<GenerateProgress />);
    expect(screen.queryByText(/oops/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /regenerate/i })).toBeNull();
  });

  it("shows the Oops message when slow is true", () => {
    render(<GenerateProgress slow />);
    expect(screen.getByText(/oops/i)).toBeDefined();
  });

  it("calls onRegenerate when the Regenerate button is clicked", () => {
    const onRegenerate = vi.fn();
    render(<GenerateProgress slow onRegenerate={onRegenerate} />);
    fireEvent.click(screen.getByRole("button", { name: /regenerate/i }));
    expect(onRegenerate).toHaveBeenCalledOnce();
  });
});

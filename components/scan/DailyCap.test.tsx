/// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { DailyCap } from "./DailyCap";

beforeEach(() => {
  vi.useFakeTimers();
  cleanup();
});

afterEach(() => {
  vi.useRealTimers();
});

// One hour from "now" in fake time
const ONE_HOUR_MS = 60 * 60 * 1_000;

describe("DailyCap", () => {
  it("shows the destructive policy banner", () => {
    render(<DailyCap retryAtMs={Date.now() + ONE_HOUR_MS} />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText(/google's policies/i)).toBeDefined();
    expect(screen.getByText(/review farming/i)).toBeDefined();
  });

  it("shows the countdown timer", () => {
    render(<DailyCap retryAtMs={Date.now() + ONE_HOUR_MS} />);
    expect(screen.getByTestId("daily-cap-timer")).toBeDefined();
    expect(screen.getByText(/available again in/i)).toBeDefined();
  });

  it("does not show the Google Reviews link", () => {
    render(<DailyCap retryAtMs={Date.now() + ONE_HOUR_MS} />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("shows 'You can try again now' and a reload button when the timer expires", () => {
    const retryAtMs = Date.now() + 500;
    render(<DailyCap retryAtMs={retryAtMs} />);
    // Advance past the expiry and flush React state
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByText(/you can try again now/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /reload/i })).toBeDefined();
    expect(screen.queryByTestId("daily-cap-timer")).toBeNull();
  });
});

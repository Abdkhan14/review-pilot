/// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { expect, describe, it, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/flags", () => ({
  isNewLandingEnabled: vi.fn(),
  isSelfServeEnabled: vi.fn(),
}));

// LiveDemo is an async server component that uses server-only modules — stub it out.
vi.mock("@/components/landing/LiveDemo", () => ({
  LiveDemo: () => null,
}));

import { isNewLandingEnabled, isSelfServeEnabled } from "@/lib/flags";
import HomePage from "./page";

const mockNewLanding = vi.mocked(isNewLandingEnabled);
const mockSelfServe = vi.mocked(isSelfServeEnabled);

beforeEach(() => {
  cleanup();
  mockNewLanding.mockReset();
  mockSelfServe.mockReset();
  mockSelfServe.mockResolvedValue(false);
});

async function renderPage(from?: string) {
  const params = Promise.resolve({ from });
  const element = await HomePage({ searchParams: params });
  render(element);
}

describe("HomePage", () => {
  it("renders the legacy home when FF_NEW_LANDING is off", async () => {
    mockNewLanding.mockResolvedValue(false);
    await renderPage();
    expect(
      screen.getByRole("heading", { name: /google reviews, minus the hard part/i })
    ).toBeDefined();
  });

  it("renders the new landing when FF_NEW_LANDING is on", async () => {
    mockNewLanding.mockResolvedValue(true);
    await renderPage();
    expect(screen.getAllByRole("navigation").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /google reviews/i })).toBeDefined();
  });
});

/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("@/hooks/api", () => ({ api: { post: vi.fn() } }));
vi.mock("@/hooks/usePlaceSearch", () => ({ usePlaceSearch: vi.fn() }));
vi.mock("@/hooks/useCreateDemo", () => ({ useCreateDemo: vi.fn() }));
vi.mock("server-only", () => ({}));

import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DemoWidget } from "./DemoWidget";
import * as placeSearchHook from "@/hooks/usePlaceSearch";
import * as createDemoHook from "@/hooks/useCreateDemo";

const mockUsePlaceSearch = vi.mocked(placeSearchHook.usePlaceSearch);
const mockUseCreateDemo = vi.mocked(createDemoHook.useCreateDemo);

const PLACE = { placeId: "ChIJabc", name: "Joe's Pizza", address: "214 Mulberry St" };

const IDLE_SEARCH = {
  query: "",
  setQuery: vi.fn(),
  state: { status: "idle" as const },
  sessionToken: "tok-1",
  select: vi.fn(),
  reset: vi.fn(),
};

const IDLE_DEMO = {
  state: { status: "idle" as const },
  create: vi.fn(),
  reset: vi.fn(),
};

const RESULT_DATA = {
  id: "sess1",
  name: "Joe's Pizza",
  assistedUrl: "https://app.com/d/sess1",
  basicUrl: "https://app.com/d/sess1?plan=basic",
  assistedQrSvg: "<svg></svg>",
  basicQrSvg: "<svg></svg>",
  triesLeft: 4,
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mockUsePlaceSearch.mockReturnValue(IDLE_SEARCH);
  mockUseCreateDemo.mockReturnValue(IDLE_DEMO);
});

describe("DemoWidget", () => {
  it("renders the search form and QR placeholder in idle state", () => {
    render(<DemoWidget />);
    expect(screen.getByRole("combobox")).toBeDefined();
    expect(screen.getByText("Your demo QR code")).toBeDefined();
  });

  it("shows search results dropdown when status is results", () => {
    mockUsePlaceSearch.mockReturnValue({
      ...IDLE_SEARCH,
      query: "Joe",
      state: { status: "results", places: [PLACE] },
    });
    render(<DemoWidget />);
    expect(screen.getByText("Joe's Pizza")).toBeDefined();
    expect(screen.getByText("214 Mulberry St")).toBeDefined();
  });

  it("hides dropdown after a place is selected", () => {
    // After selection, selectedPlace is set and state goes idle — dropdown closes.
    const selectFn = vi.fn();
    mockUsePlaceSearch.mockReturnValue({
      ...IDLE_SEARCH,
      query: "Joe's Pizza",
      state: { status: "idle" as const },
      select: selectFn,
    });
    render(<DemoWidget />);
    // No list box should appear when state is idle.
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("submit button disabled without notes", () => {
    // selectedPlace set via hook mock returning a place name as query —
    // but notes is empty, so the button must stay disabled.
    mockUsePlaceSearch.mockReturnValue({
      ...IDLE_SEARCH,
      query: "Joe's Pizza",
      state: { status: "idle" as const },
    });
    render(<DemoWidget />);
    const btn = screen.getByRole("button", { name: "Generate demo link" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows result card and placeholder is gone when demo state is result", () => {
    mockUseCreateDemo.mockReturnValue({
      ...IDLE_DEMO,
      state: { status: "result", data: RESULT_DATA },
    });
    render(<DemoWidget />);
    expect(screen.getByText("Scan with your phone camera")).toBeDefined();
    expect(screen.getByText("4 tries left")).toBeDefined();
    expect(screen.getByRole("button", { name: "Make another" })).toBeDefined();
    // Placeholder should not be present
    expect(screen.queryByText("Your demo QR code")).toBeNull();
  });

  it("swaps link when Basic is selected on result card", () => {
    mockUseCreateDemo.mockReturnValue({
      ...IDLE_DEMO,
      state: { status: "result", data: RESULT_DATA },
    });
    render(<DemoWidget />);
    fireEvent.click(screen.getByRole("button", { name: "Basic" }));
    expect(screen.getByText("https://app.com/d/sess1?plan=basic")).toBeDefined();
  });

  it("shows error message for each error code", () => {
    const codes: Array<import("@/hooks/useCreateDemo").DemoErrorCode> = [
      "blocked", "visitor_limit", "busy", "used_up", "place_failed", "rate_limited", "network",
    ];
    for (const code of codes) {
      mockUseCreateDemo.mockReturnValue({
        ...IDLE_DEMO,
        state: { status: "error", code },
      });
      const { unmount } = render(<DemoWidget />);
      expect(screen.getByRole("button", { name: "Try again" })).toBeDefined();
      unmount();
    }
  });
});

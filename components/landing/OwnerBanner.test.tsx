/// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { Landing } from "./Landing";

// LiveDemo is an async server component that uses server-only modules — stub it out.
vi.mock("./LiveDemo", () => ({
  LiveDemo: () => null,
}));

afterEach(() => cleanup());

describe("OwnerBanner", () => {
  it("is shown when fromQr is true", () => {
    render(<Landing fromQr selfServe={false} />);
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByText(/own this business/i)).toBeDefined();
  });

  it("is absent when fromQr is false", () => {
    render(<Landing selfServe={false} />);
    expect(screen.queryByText(/own this business/i)).toBeNull();
  });

  it("disappears after dismiss", () => {
    render(<Landing fromQr selfServe={false} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText(/own this business/i)).toBeNull();
  });
});

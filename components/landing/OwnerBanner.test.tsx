/// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { Landing } from "./Landing";

afterEach(() => cleanup());

describe("OwnerBanner", () => {
  it("is shown when fromQr is true", () => {
    render(<Landing fromQr />);
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByText(/this is what your customers see/i)).toBeDefined();
  });

  it("is absent when fromQr is false", () => {
    render(<Landing />);
    expect(screen.queryByText(/this is what your customers see/i)).toBeNull();
  });

  it("disappears after dismiss", () => {
    render(<Landing fromQr />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText(/this is what your customers see/i)).toBeNull();
  });
});

/// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Button } from "./button";

afterEach(() => cleanup());

describe("Button", () => {
  it("asChild puts padding and href on the same element", () => {
    render(
      <Button asChild variant="outline">
        <a href="/admin/businesses/new">+ New business</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: /\+ new business/i });
    expect(link.getAttribute("href")).toBe("/admin/businesses/new");
    expect(link.className).toMatch(/px-4/);
    expect(link.className).toMatch(/py-2/);
    expect(link.querySelector("a")).toBeNull();
  });

  it("renders a native button when asChild is omitted", () => {
    render(<Button type="submit">Save</Button>);
    const btn = screen.getByRole("button", { name: /save/i });
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.className).toMatch(/px-4/);
  });
});

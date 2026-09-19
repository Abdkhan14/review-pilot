/// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import QrPanel from "./QrPanel";

afterEach(() => cleanup());

const defaultProps = {
  id: "cuid-1",
  slug: "joes-pizza-ab12",
  svg: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
};

describe("QrPanel", () => {
  it("PNG link uses format=png and the business id", () => {
    render(<QrPanel {...defaultProps} />);
    const link = screen.getByRole("link", { name: /download png/i });
    expect(link.getAttribute("href")).toContain("format=png");
    expect(link.getAttribute("href")).toContain("cuid-1");
  });

  it("SVG link uses format=svg and the business id", () => {
    render(<QrPanel {...defaultProps} />);
    const link = screen.getByRole("link", { name: /download svg/i });
    expect(link.getAttribute("href")).toContain("format=svg");
    expect(link.getAttribute("href")).toContain("cuid-1");
  });

  it("renders an accessible QR preview", () => {
    render(<QrPanel {...defaultProps} />);
    const preview = screen.getByRole("img", { name: /qr code/i });
    expect(preview).toBeDefined();
  });
});

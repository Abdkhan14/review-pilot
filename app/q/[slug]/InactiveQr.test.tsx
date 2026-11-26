/// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InactiveQr } from "./InactiveQr";

describe("InactiveQr", () => {
  it("asks the owner to pick a plan and tells customers the code isn't set up", () => {
    render(<InactiveQr shopName="Joe's Pizza" />);
    expect(screen.getByText(/own joe's pizza\? pick a plan/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /pick a plan/i }).getAttribute("href")).toBe("/app");
    expect(screen.getByText(/here to leave a review\?/i)).toBeDefined();
  });
});

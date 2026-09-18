/// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";

afterEach(() => cleanup());
import { BusinessList } from "./BusinessList";

const fixtures = [
  { name: "Joe's Pizza", tier: "BASIC", slug: "joes-pizza-ab12" },
  { name: "Mike's Salon", tier: "SAAS", slug: "mikes-salon-cd34" },
];

describe("BusinessList", () => {
  it("renders names and tiers from the list", () => {
    render(<BusinessList businesses={fixtures} />);
    expect(screen.getByText("Joe's Pizza")).toBeDefined();
    expect(screen.getByText("BASIC")).toBeDefined();
    expect(screen.getByText("Mike's Salon")).toBeDefined();
    expect(screen.getByText("SAAS")).toBeDefined();
  });

  it("renders slugs", () => {
    render(<BusinessList businesses={fixtures} />);
    expect(screen.getByText("joes-pizza-ab12")).toBeDefined();
    expect(screen.getByText("mikes-salon-cd34")).toBeDefined();
  });

  it("renders without throwing when the list is empty", () => {
    render(<BusinessList businesses={[]} />);
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});

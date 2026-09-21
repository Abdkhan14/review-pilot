/// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";

afterEach(() => cleanup());
import { BusinessList } from "./BusinessList";

const fixtures = [
  { id: "cuid-1", name: "Joe's Pizza", tier: "BASIC", slug: "joes-pizza-ab12", placeId: "ChIJN1t_pizza" },
  { id: "cuid-2", name: "Mike's Salon", tier: "SAAS", slug: "mikes-salon-cd34", placeId: "ChIJN1t_salon" },
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

  it("renders placeIds with label", () => {
    render(<BusinessList businesses={fixtures} />);
    expect(screen.getByText("Place ID: ChIJN1t_pizza")).toBeDefined();
    expect(screen.getByText("Place ID: ChIJN1t_salon")).toBeDefined();
  });

  it("renders without throwing when the list is empty", () => {
    render(<BusinessList businesses={[]} />);
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});

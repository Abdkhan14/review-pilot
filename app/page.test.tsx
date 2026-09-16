import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "./page";

test("renders the Review Pilot heading", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: "Review Pilot" })).toBeDefined();
});

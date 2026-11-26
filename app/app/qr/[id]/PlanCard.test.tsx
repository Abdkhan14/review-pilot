/// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { PlanCard } from "./PlanCard";

afterEach(() => cleanup());

const trial = { started: true, generationsUsed: 3, generationLimit: 5, handoffsUsed: 1, handoffLimit: 2 };

describe("PlanCard", () => {
  it("shows trial usage meters and locked paid plans during the trial", () => {
    render(<PlanCard state="trial" trial={trial} statusLine="" />);
    expect(screen.getByRole("progressbar", { name: "Generations" }).getAttribute("aria-valuenow")).toBe("3");
    expect(screen.getByRole("progressbar", { name: "Handoffs" }).getAttribute("aria-valuenow")).toBe("1");
    expect(screen.getByRole("button", { name: /assisted/i })).toHaveProperty("disabled", true);
  });

  it("shows the ended trial when the QR is inactive", () => {
    render(<PlanCard state="inactive" trial={{ ...trial, handoffsUsed: 2 }} statusLine="" />);
    expect(screen.getByText("No plan")).toBeDefined();
    expect(screen.getByText("Free trial ended")).toBeDefined();
  });
});

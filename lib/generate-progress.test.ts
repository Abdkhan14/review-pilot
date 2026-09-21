import { describe, it, expect } from "vitest";
import { stepIndexAt, progressPctAt } from "./generate-progress";

describe("stepIndexAt", () => {
  it("returns 0 at 0ms", () => expect(stepIndexAt(0)).toBe(0));
  it("returns 0 at 1999ms", () => expect(stepIndexAt(1999)).toBe(0));
  it("returns 1 at 2000ms", () => expect(stepIndexAt(2000)).toBe(1));
  it("returns 2 at 4000ms", () => expect(stepIndexAt(4000)).toBe(2));
  it("returns 4 at 9999ms", () => expect(stepIndexAt(9999)).toBe(4));
  it("clamps to 4 at exactly 10000ms", () => expect(stepIndexAt(10000)).toBe(4));
  it("clamps to 4 well beyond 10000ms", () => expect(stepIndexAt(30000)).toBe(4));
});

describe("progressPctAt", () => {
  it("returns 0 at 0ms", () => expect(progressPctAt(0)).toBe(0));
  it("returns 50 at 5000ms", () => expect(progressPctAt(5000)).toBe(50));
  it("returns 100 at 10000ms", () => expect(progressPctAt(10000)).toBe(100));
  it("clamps to 100 beyond 10000ms", () => expect(progressPctAt(15000)).toBe(100));
});

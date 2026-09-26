import { describe, it, expect } from "vitest";
import {
  DAILY_HANDOFF_LIMIT,
  utcDay,
  todayCount,
  isDailyCapped,
  msUntilNextUtcDay,
} from "./handoff";

const NOW = new Date("2026-09-26T10:00:00.000Z");
const TODAY = "2026-09-26";
const YESTERDAY = "2026-09-25";

describe("utcDay", () => {
  it("returns YYYY-MM-DD for a given Date", () => {
    expect(utcDay(NOW)).toBe(TODAY);
  });

  it("handles midnight boundary correctly", () => {
    expect(utcDay(new Date("2026-09-26T00:00:00.000Z"))).toBe(TODAY);
    expect(utcDay(new Date("2026-09-25T23:59:59.999Z"))).toBe(YESTERDAY);
  });
});

describe("todayCount", () => {
  it("returns row.count when row.day matches today", () => {
    expect(todayCount({ count: 4, day: TODAY }, NOW)).toBe(4);
  });

  it("returns 0 when row.day is yesterday", () => {
    expect(todayCount({ count: 4, day: YESTERDAY }, NOW)).toBe(0);
  });

  it("returns 0 when row is null", () => {
    expect(todayCount(null, NOW)).toBe(0);
  });

  it("returns 0 when row is undefined", () => {
    expect(todayCount(undefined, NOW)).toBe(0);
  });
});

describe("isDailyCapped", () => {
  it("returns false when count is below the limit", () => {
    expect(isDailyCapped(DAILY_HANDOFF_LIMIT - 1)).toBe(false);
  });

  it("returns true when count equals the limit", () => {
    expect(isDailyCapped(DAILY_HANDOFF_LIMIT)).toBe(true);
  });

  it("returns true when count exceeds the limit", () => {
    expect(isDailyCapped(DAILY_HANDOFF_LIMIT + 1)).toBe(true);
  });
});

describe("msUntilNextUtcDay", () => {
  it("returns ms remaining until next UTC midnight", () => {
    // 2026-09-26T10:00:00Z — 14 hours left = 50 400 000 ms
    expect(msUntilNextUtcDay(NOW)).toBe(50_400_000);
  });

  it("returns a positive number even one second before midnight", () => {
    expect(
      msUntilNextUtcDay(new Date("2026-09-26T23:59:59.000Z"))
    ).toBe(1_000);
  });
});

export const DAILY_HANDOFF_LIMIT = 6;

export type HandoffRow = { count: number; day: string };

/** UTC date string "YYYY-MM-DD" for the given Date. */
export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Today's handoff count for a business.
 * Returns 0 when the stored day is not today (day has rolled over) or there is no row.
 */
export function todayCount(row: HandoffRow | null | undefined, now: Date): number {
  if (!row) return 0;
  return row.day === utcDay(now) ? row.count : 0;
}

/** True when the daily cap has been reached or exceeded. */
export function isDailyCapped(count: number): boolean {
  return count >= DAILY_HANDOFF_LIMIT;
}

/** Unix timestamp (ms) of the next UTC midnight after `now`. */
export function nextUtcMidnightMs(now: Date): number {
  const d = new Date(now);
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}

/** Milliseconds remaining until the next UTC midnight. */
export function msUntilNextUtcDay(now: Date): number {
  return nextUtcMidnightMs(now) - now.getTime();
}

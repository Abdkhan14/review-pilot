/** "Nov 4" style date, in UTC so server and browser agree. */
export function shortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

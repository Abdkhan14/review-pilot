export const GENERATE_STEPS = [
  "Finding the place you visited",
  "Reading what others have said",
  "Thinking of what to say",
  "Drafting your review",
  "Adding the finishing touches",
] as const;

export const GENERATE_PROGRESS_MS = 10_000;

const STEP_DURATION_MS = GENERATE_PROGRESS_MS / GENERATE_STEPS.length; // 2000ms each

/**
 * Returns the 0-based index of the active step for a given elapsed time.
 * Clamped to the last step — holds there if generate takes longer than 10s.
 */
export function stepIndexAt(elapsedMs: number): number {
  const idx = Math.floor(elapsedMs / STEP_DURATION_MS);
  return Math.min(idx, GENERATE_STEPS.length - 1);
}

/**
 * Returns a 0–100 fill percentage for the progress bar, clamped at 100.
 */
export function progressPctAt(elapsedMs: number): number {
  return Math.min((elapsedMs / GENERATE_PROGRESS_MS) * 100, 100);
}

// The player's breathing exercise: 4 seconds in, 6 out, round after round
// (components/breathing-guide.tsx shows it). Pure, so it's tested directly
// (tests/breath-count.test.mjs).

export const BREATH_IN_SECONDS = 4;
export const BREATH_OUT_SECONDS = 6;

export interface BreathCount {
  phase: "in" | "out";
  /** Seconds left in this half of the breath: 4..1 in, 6..1 out. */
  count: number;
  /** Which breath this is, from 1. */
  breath: number;
}

/** The count `seconds` after the exercise began. */
export function breathCountAt(seconds: number): BreathCount {
  const cycle = BREATH_IN_SECONDS + BREATH_OUT_SECONDS;
  const within = seconds % cycle;
  const breath = Math.floor(seconds / cycle) + 1;
  if (within < BREATH_IN_SECONDS) return { phase: "in", count: Math.max(1, Math.ceil(BREATH_IN_SECONDS - within)), breath };
  return { phase: "out", count: Math.max(1, Math.ceil(cycle - within)), breath };
}


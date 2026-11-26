// Time actually listened, and what it means for a Practice day. No imports
// beyond types, so the rules are tested directly (tests/listening.test.mjs).

/** What a Pause record keeps about listening. */
export interface Listening {
  durationSeconds: number;
  completedAt?: string;
  /** Seconds actually playing, in total. Missing on records from before it was counted. */
  listenedSeconds?: number;
  /** Seconds actually playing, per local calendar day ("2026-11-26"). */
  listenedByDay?: Record<string, number>;
  /** Where the Pause clock stood when it last played. */
  positionSeconds?: number;
}

/** A local calendar day, "2026-11-26". */
export function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** The record with `seconds` more listening on `now`'s day, the clock at `position`. */
export function addListening<T extends Listening>(record: T, seconds: number, position: number, now = new Date()): T {
  const key = localDateKey(now);
  const byDay = { ...(record.listenedByDay ?? {}) };
  byDay[key] = round((byDay[key] ?? 0) + seconds);
  return {
    ...record,
    listenedByDay: byDay,
    listenedSeconds: round((record.listenedSeconds ?? 0) + seconds),
    positionSeconds: round(Math.min(record.durationSeconds, Math.max(0, position))),
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

/** Total time listened. Records from before it was counted show their planned length. */
export function listenedSeconds(record: Listening) {
  if (record.listenedSeconds !== undefined) return record.listenedSeconds;
  return record.durationSeconds;
}

export function listenedOn(record: Listening, now = new Date()) {
  return record.listenedByDay?.[localDateKey(now)] ?? 0;
}

/** A Practice day counts once one calendar day's listening adds up to half its session. */
export function neededSeconds(record: Listening) {
  return record.durationSeconds / 2;
}

export function countsAsDay(record: Listening) {
  // Older records were never timed: their check-in completed the day, as it did then.
  if (record.listenedByDay === undefined) return Boolean(record.completedAt);
  const need = neededSeconds(record);
  return Object.values(record.listenedByDay).some((seconds) => seconds >= need - 0.5);
}

/**
 * Where a day's Pause picks up: where you left off, unless what's left of it
 * can no longer make up today's half, in which case from the start.
 */
export function resumeAt(record: Listening, now = new Date()) {
  const position = record.positionSeconds ?? 0;
  if (position <= 0 || position >= record.durationSeconds) return 0;
  const stillNeeded = neededSeconds(record) - listenedOn(record, now);
  return record.durationSeconds - position >= stillNeeded ? position : 0;
}

/** Practice days open one a day: true when the last day was done today. */
export function nextDayOpensTomorrow(completions: Array<{ completedAt: string }>, totalDays: number, now = new Date()) {
  if (completions.length === 0 || completions.length >= totalDays) return false;
  const last = completions.map((item) => item.completedAt).sort().at(-1)!;
  return localDateKey(new Date(last)) === localDateKey(now);
}

/** "3 min", or "Under 1 min" for less than a minute. */
export function minutesLabel(seconds: number) {
  return seconds < 60 ? "Under 1 min" : `${Math.round(seconds / 60)} min`;
}

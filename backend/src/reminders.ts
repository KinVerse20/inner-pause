// Practice reminders: when one is due, and what it says. Pure, so it's
// tested without a database or a push service (tests/reminders.test.mjs).
// The sender that uses this lives in push-scheduler.ts.

/** The five Practice paths (frontend/lib/programme-data.ts), as named in the app. */
export const PRACTICE_PATH_NAMES: Record<string, string> = {
  confidence: "Confidence",
  anxiety: "Uncertainty",
  focus: "Focus",
  reactivity: "Emotional Regulation",
  sleep: "Rest",
};

export const isPracticePathId = (value: unknown): value is string => typeof value === "string" && value in PRACTICE_PATH_NAMES;

/** How long after the chosen time a missed reminder may still go out (server down, say). */
export const CATCH_UP_MINUTES = 120;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseReminderTime(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = TIME_PATTERN.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** The calendar date and minute of the day it is now, where the listener is. */
export function localClock(now: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export interface ReminderSchedule {
  reminderTime: string;
  timezone: string;
  lastSentLocalDate?: string;
}

/**
 * The local date to send for, or null if nothing is due: once a local day,
 * at or after the chosen time, and not later than the catch-up window.
 */
export function dueLocalDate(schedule: ReminderSchedule, now: Date): string | null {
  const target = parseReminderTime(schedule.reminderTime);
  if (target === null || !isValidTimeZone(schedule.timezone)) return null;
  const { date, minutes } = localClock(now, schedule.timezone);
  if (schedule.lastSentLocalDate === date) return null;
  return minutes >= target && minutes < target + CATCH_UP_MINUTES ? date : null;
}

/** What the notification says (service worker: frontend/public/sw.js). */
export function reminderMessage(pathId: string, localDate: string) {
  const name = PRACTICE_PATH_NAMES[pathId];
  return {
    title: "Your Practice is ready",
    body: name ? `A few minutes for your ${name} path. Small steps count.` : "A few minutes for your Practice. Small steps count.",
    tag: `practice-${pathId}-${localDate}`,
    url: `/practice/${pathId}`,
  };
}

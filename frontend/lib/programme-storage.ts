'use client';

// Programme enrollments, check-ins and streaks — Kinverse's Practice
// storage (same localStorage key, so existing test data carries over).

import { countsAsDay, localDateKey } from "@/lib/listening";
import { getPauseRecord } from "@/lib/pause-storage";
import type { ProgrammeId } from "@/lib/programme-data";

import type { TaskAnswer } from "@/lib/practice-tasks";

/** How the task from the day before went (lib/practice-tasks.ts). */
export type { TaskAnswer };

export interface ProgrammeCheckIn {
  day: number;
  /** An optional note. Older check-ins: the "about yesterday" text. */
  text: string;
  /** Older check-ins only: the written exercise, which now lives in the Pause. */
  exerciseResponse?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  /** The task from the day before: Yes, Partly or Not yet. Missing on Day 1 and older check-ins. */
  taskAnswer?: TaskAnswer;
  /** How you are today, in one word. */
  feeling?: string;
  createdAt: string;
}

export interface ProgrammeCompletion {
  day: number;
  completedAt: string;
  reflection?: string;
  /** The path screen has shown this day's "You showed up". Missing on older records: shown. */
  celebrated?: boolean;
}

export interface ProgrammeEnrollment {
  id: string;
  issueId: ProgrammeId;
  startedAt: string;
  reminderTime: string;
  reminderEnabled: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  checkIns: ProgrammeCheckIn[];
  completions: ProgrammeCompletion[];
  status: 'active' | 'completed';
  /** The Pause started for a day, completed once that Pause record completes. */
  pendingPause?: { day: number; pauseRecordId: string };
}

export interface ProgrammeState {
  enrollments: ProgrammeEnrollment[];
  activeEnrollmentId?: string;
}

const KEY = 'innerpause-practices-v1';
const defaults: ProgrammeState = { enrollments: [] };

export function readProgrammeState(): ProgrammeState {
  if (typeof window === 'undefined') return defaults;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '{}') as Partial<ProgrammeState>;
    return {
      enrollments: Array.isArray(parsed.enrollments) ? parsed.enrollments : [],
      activeEnrollmentId: typeof parsed.activeEnrollmentId === 'string' ? parsed.activeEnrollmentId : undefined,
    };
  } catch {
    return defaults;
  }
}

export function writeProgrammeState(state: ProgrammeState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('innerpause-practice-change'));
}

export function clearProgrammeState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem('innerpause-pending-push-subscription');
  window.dispatchEvent(new Event('innerpause-practice-change'));
}

export function activeProgramme(state: ProgrammeState) {
  return state.enrollments.find(item => item.id === state.activeEnrollmentId && item.status === 'active');
}

export function currentProgrammeDay(enrollment: ProgrammeEnrollment) {
  return Math.min(14, enrollment.completions.length + 1);
}

export function programmeStreak(enrollment: ProgrammeEnrollment, today = new Date()) {
  const dates = [...new Set(enrollment.completions.map(item => localDateKey(new Date(item.completedAt))))].sort().reverse();
  if (!dates.length) return 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayKey = localDateKey(cursor);
  cursor.setDate(cursor.getDate() - 1);
  const yesterdayKey = localDateKey(cursor);
  if (dates[0] !== todayKey && dates[0] !== yesterdayKey) return 0;
  let streak = 0;
  const expected = new Date(dates[0] === todayKey ? today : cursor);
  expected.setHours(0, 0, 0, 0);
  for (const date of dates) {
    if (date !== localDateKey(expected)) break;
    streak += 1;
    expected.setDate(expected.getDate() - 1);
  }
  return streak;
}

export function longestProgrammeStreak(enrollment: ProgrammeEnrollment) {
  const dates = [...new Set(enrollment.completions.map(item => localDateKey(new Date(item.completedAt))))].sort();
  let longest = 0;
  let current = 0;
  let previous: Date | undefined;
  for (const key of dates) {
    const date = new Date(`${key}T00:00:00`);
    const gap = previous ? Math.round((date.getTime() - previous.getTime()) / 86_400_000) : 1;
    current = gap === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = date;
  }
  return longest;
}

const PATH_DAYS = 14;

/**
 * Completes every pending Practice day whose Pause has been listened to
 * enough (lib/listening.ts: half the session within one calendar day).
 * Called as listening is saved, and when a path screen opens. Returns the
 * new state, or null when nothing changed.
 */
export function settlePracticeDays(state: ProgrammeState = readProgrammeState()): ProgrammeState | null {
  let changed = false;
  const enrollments = state.enrollments.map((enrollment) => {
    const pending = enrollment.pendingPause;
    if (!pending) return enrollment;
    const record = getPauseRecord(pending.pauseRecordId);
    if (!record || !countsAsDay(record)) return enrollment;
    changed = true;
    const completions = [
      ...enrollment.completions.filter((item) => item.day !== pending.day),
      { day: pending.day, completedAt: new Date().toISOString(), celebrated: false },
    ].sort((a, b) => a.day - b.day);
    return {
      ...enrollment,
      completions,
      pendingPause: undefined,
      status: completions.length >= PATH_DAYS ? ('completed' as const) : ('active' as const),
    };
  });
  if (!changed) return null;
  const next = { ...state, enrollments };
  writeProgrammeState(next);
  return next;
}

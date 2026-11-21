'use client';

import type { PracticeIssueId } from './practice-data';

export interface PracticeCheckIn {
  day: number;
  text: string;
  exerciseResponse?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

export interface PracticeCompletion {
  day: number;
  completedAt: string;
  reflection?: string;
}

export interface PracticeEnrollment {
  id: string;
  issueId: PracticeIssueId;
  startedAt: string;
  reminderTime: string;
  reminderEnabled: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  checkIns: PracticeCheckIn[];
  completions: PracticeCompletion[];
  status: 'active' | 'completed';
}

export interface PracticeState {
  enrollments: PracticeEnrollment[];
  activeEnrollmentId?: string;
}

const KEY = 'innerpause-practices-v1';
const defaults: PracticeState = { enrollments: [] };

export function readPracticeState(): PracticeState {
  if (typeof window === 'undefined') return defaults;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '{}') as Partial<PracticeState>;
    return {
      enrollments: Array.isArray(parsed.enrollments) ? parsed.enrollments : [],
      activeEnrollmentId: typeof parsed.activeEnrollmentId === 'string' ? parsed.activeEnrollmentId : undefined,
    };
  } catch {
    return defaults;
  }
}

export function writePracticeState(state: PracticeState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('innerpause-practice-change'));
}

export function clearPracticeState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem('innerpause-pending-push-subscription');
  window.dispatchEvent(new Event('innerpause-practice-change'));
}

export function activePractice(state: PracticeState) {
  return state.enrollments.find(item => item.id === state.activeEnrollmentId && item.status === 'active');
}

export function currentPracticeDay(enrollment: PracticeEnrollment) {
  return Math.min(14, enrollment.completions.length + 1);
}

export function practiceStreak(enrollment: PracticeEnrollment, today = new Date()) {
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

export function longestPracticeStreak(enrollment: PracticeEnrollment) {
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

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

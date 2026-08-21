"use client";

import type { CheckInTier } from "@/lib/practice-content";
import type { PracticeSkillId } from "@/lib/practice-skills";
import type { PauseFeedback } from "@/lib/pause-storage";

// Local persistence for Practice (docs/TECHNICAL_ARCHITECTURE.md §6):
// deliberately fresh, not lib/progress.ts's legacy chakra-unlock/streak/
// badge engine (§6: "temporary legacy structure to migrate away from" —
// wrong skill count/names, sequential-unlock semantics the current docs
// don't describe, and a streak/points model this slice's brief explicitly
// says not to use as the primary progress model). Same reasoning that kept
// lib/pause-storage.ts separate from the legacy HealingPlan model.

export type PracticePhase = "core-arc" | "ongoing";

// One row per skill the user has ever engaged with — independent per skill
// (skills are not sequentially unlocked, unlike the legacy chakra chain).
export interface PracticeEnrollment {
  skillId: PracticeSkillId;
  phase: PracticePhase;
  /** The next session number to start/continue at — 1-indexed, continuous across core-arc -> ongoing. */
  currentSessionNumber: number;
  completedSessionNumbers: number[];
  skippedSessionNumbers: number[];
  milestoneEarnedAt?: string;
  startedAt: string;
  updatedAt: string;
  /**
   * A deterministic personalization foundation (this slice's brief §12): the
   * most recent early-signal check-in's chosen option, if any — captured so
   * future sessions *can* adapt on it, without this slice building the full
   * adaptation logic that reads it.
   */
  preferredSupport?: string;
}

export interface PracticeCheckInRecord {
  id: string;
  skillId: PracticeSkillId;
  tier: CheckInTier;
  atSessionNumber: number;
  response?: string;
  skipped: boolean;
  createdAt: string;
}

export interface PracticeSessionRecord {
  id: string;
  skillId: PracticeSkillId;
  sessionNumber: number;
  startedAt: string;
  completedAt?: string;
  tellText?: string;
  linkedPauseRecordId?: string;
  pauseFeedback?: PauseFeedback;
  activityResponse?: string;
  activityRealWorldRep?: string;
  returnText?: string;
  returnSkipped?: boolean;
}

const ENROLLMENT_KEY = "inner-pause:practice-enrollments";
const SESSION_KEY = "inner-pause:practice-sessions";
const CHECKIN_KEY = "inner-pause:practice-checkins";
const EVENT_NAME = "inner-pause:practice-change";

const isBrowser = () => typeof window !== "undefined";

function readJson<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, value: T[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT_NAME));
}

// ---------- Enrollments ----------

export function getEnrollment(skillId: PracticeSkillId): PracticeEnrollment | undefined {
  return readJson<PracticeEnrollment>(ENROLLMENT_KEY).find((item) => item.skillId === skillId);
}

export function ensureEnrollment(skillId: PracticeSkillId): PracticeEnrollment {
  const existing = getEnrollment(skillId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const enrollment: PracticeEnrollment = {
    skillId,
    phase: "core-arc",
    currentSessionNumber: 1,
    completedSessionNumbers: [],
    skippedSessionNumbers: [],
    startedAt: now,
    updatedAt: now,
  };
  writeJson(ENROLLMENT_KEY, [...readJson<PracticeEnrollment>(ENROLLMENT_KEY), enrollment]);
  return enrollment;
}

export function updateEnrollment(skillId: PracticeSkillId, patch: Partial<PracticeEnrollment>): PracticeEnrollment {
  const all = readJson<PracticeEnrollment>(ENROLLMENT_KEY);
  let updated: PracticeEnrollment | undefined;
  const next = all.map((item) => {
    if (item.skillId !== skillId) return item;
    updated = { ...item, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) return ensureEnrollment(skillId);
  writeJson(ENROLLMENT_KEY, next);
  return updated;
}

export function listEnrollments(): PracticeEnrollment[] {
  return readJson<PracticeEnrollment>(ENROLLMENT_KEY);
}

// ---------- Session records ----------

export function createPracticeSessionRecord(skillId: PracticeSkillId, sessionNumber: number): PracticeSessionRecord {
  const record: PracticeSessionRecord = {
    id: crypto.randomUUID(),
    skillId,
    sessionNumber,
    startedAt: new Date().toISOString(),
  };
  writeJson(SESSION_KEY, [record, ...readJson<PracticeSessionRecord>(SESSION_KEY)]);
  return record;
}

export function getPracticeSessionRecord(id: string): PracticeSessionRecord | undefined {
  return readJson<PracticeSessionRecord>(SESSION_KEY).find((item) => item.id === id);
}

export function updatePracticeSessionRecord(id: string, patch: Partial<PracticeSessionRecord>): PracticeSessionRecord | undefined {
  const all = readJson<PracticeSessionRecord>(SESSION_KEY);
  let updated: PracticeSessionRecord | undefined;
  const next = all.map((item) => {
    if (item.id !== id) return item;
    updated = { ...item, ...patch };
    return updated;
  });
  writeJson(SESSION_KEY, next);
  return updated;
}

export function listPracticeSessionRecords(skillId?: PracticeSkillId): PracticeSessionRecord[] {
  const all = readJson<PracticeSessionRecord>(SESSION_KEY);
  return skillId ? all.filter((item) => item.skillId === skillId) : all;
}

// ---------- Check-ins ----------

export function createPracticeCheckIn(input: Omit<PracticeCheckInRecord, "id" | "createdAt">): PracticeCheckInRecord {
  const record: PracticeCheckInRecord = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  writeJson(CHECKIN_KEY, [record, ...readJson<PracticeCheckInRecord>(CHECKIN_KEY)]);
  return record;
}

export function listPracticeCheckIns(skillId?: PracticeSkillId): PracticeCheckInRecord[] {
  const all = readJson<PracticeCheckInRecord>(CHECKIN_KEY);
  return skillId ? all.filter((item) => item.skillId === skillId) : all;
}

export function subscribePracticeChange(callback: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

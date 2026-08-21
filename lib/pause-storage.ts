"use client";

import type { PauseDefinition } from "@/lib/pause-engine";

// Minimal local-first store for the `Pause` entity
// (docs/TECHNICAL_ARCHITECTURE.md §4: "PauseType + duration + optional
// feedback"). Deliberately separate from lib/mvp-storage.ts's
// JournalEntry/HealingPlan shape — that model is a heavier multi-block
// "healing journey" structure the current product doc no longer describes;
// this is the simpler single-Pause record the target domain model actually
// calls for. Not an IndexedDB migration — still localStorage, matching
// "development remains local" and "do not perform unrelated migrations."

export type PauseFeedback = "better" | "same" | "not-better";

export interface PauseRecord extends PauseDefinition {
  id: string;
  startedAt: string;
  completedAt?: string;
  feedback?: PauseFeedback;
}

const STORAGE_KEY = "inner-pause:pause-records";
const CHANGE_EVENT = "inner-pause:pause-records-change";

const isBrowser = () => typeof window !== "undefined";

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function readRecords(): PauseRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PauseRecord[]) : [];
  } catch {
    return [];
  }
}

function writeRecords(records: PauseRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribePauseRecords(callback: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export function createPauseRecord(definition: PauseDefinition): PauseRecord {
  const record: PauseRecord = {
    ...definition,
    id: makeId(),
    startedAt: new Date().toISOString(),
  };
  writeRecords([record, ...readRecords()]);
  return record;
}

export function getPauseRecord(id: string): PauseRecord | undefined {
  return readRecords().find((record) => record.id === id);
}

export function completePauseRecord(id: string, feedback?: PauseFeedback) {
  const records = readRecords();
  const updated = records.map((record) =>
    record.id === id ? { ...record, completedAt: new Date().toISOString(), feedback } : record,
  );
  writeRecords(updated);
}

/**
 * The most recently *completed* Pause before the given one — used to detect
 * "Not better, twice in a row" (docs/PRODUCT_FLOW.md §10/§40): if this and
 * the current record both have feedback "not-better", the retry offer must
 * not be shown a second time.
 */
export function getPreviousCompletedPauseRecord(excludeId: string): PauseRecord | undefined {
  return readRecords()
    .filter((record) => record.id !== excludeId && record.completedAt)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1))[0];
}

export function listPauseRecords(): PauseRecord[] {
  return readRecords();
}

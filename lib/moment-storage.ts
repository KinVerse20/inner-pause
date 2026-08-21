"use client";

import type { BigMomentMode } from "@/lib/big-moment-engine";
import type { PauseFeedback } from "@/lib/pause-storage";

// Local persistence for the BigMoment entity (docs/TECHNICAL_ARCHITECTURE.md
// §4: "A named meaningful event... optionally calendar-linked, hosting
// Before/During/After Pauses"). Deliberately a fresh, lightweight store —
// same reasoning as lib/pause-storage.ts and lib/tell-storage.ts: this
// slice's target shape doesn't need the legacy multi-block model.
//
// Return to Me (docs/PRODUCT_FLOW.md §15) gets its own small lifecycle here
// rather than reusing TECHNICAL_ARCHITECTURE §4's full MomentState enum
// (upcoming -> before-done -> ... -> resolved) — that enum models a moment
// tracked across multiple future calendar-linked visits, which is future
// scope (§9 of this slice's brief explicitly defers calendar-linking).
// "Use whatever naming best fits the existing architecture, but keep the
// model simple" — this is that simplification, scoped to what a single
// manually-created moment in this slice actually needs.
export type ReturnToMeStatus = "not-applicable" | "pending" | "surfaced" | "responded" | "dismissed" | "expired";

export interface ReturnToMeState {
  status: ReturnToMeStatus;
  /** ISO timestamp — when this becomes eligible to surface (docs/PRODUCT_FLOW.md §15's "the following day, at an appropriate time"). */
  triggerAt?: string;
  surfacedAt?: string;
  respondedAt?: string;
  responseText?: string;
  dismissedAt?: string;
}

export interface MomentRecord {
  id: string;
  mode: BigMomentMode;
  situationId: string | null;
  situationLabel: string | null;
  createdAt: string;
  linkedPauseRecordId: string;
  expression?: string;
  feedback?: PauseFeedback;
  returnToMe: ReturnToMeState;
}

const STORAGE_KEY = "inner-pause:moment-records";
const EVENT_NAME = "inner-pause:moment-records-change";

const isBrowser = () => typeof window !== "undefined";

function readAll(): MomentRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MomentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: MomentRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function createMomentRecord(input: {
  mode: BigMomentMode;
  situationId: string | null;
  situationLabel: string | null;
  linkedPauseRecordId: string;
  expression?: string;
  returnToMe: ReturnToMeState;
}): MomentRecord {
  const record: MomentRecord = {
    id: crypto.randomUUID(),
    mode: input.mode,
    situationId: input.situationId,
    situationLabel: input.situationLabel,
    createdAt: new Date().toISOString(),
    linkedPauseRecordId: input.linkedPauseRecordId,
    expression: input.expression,
    returnToMe: input.returnToMe,
  };
  writeAll([record, ...readAll()]);
  return record;
}

export function getMomentRecord(id: string): MomentRecord | undefined {
  return readAll().find((record) => record.id === id);
}

export function updateMomentRecord(id: string, patch: Partial<MomentRecord>): MomentRecord | undefined {
  let updated: MomentRecord | undefined;
  writeAll(
    readAll().map((record) => {
      if (record.id !== id) return record;
      updated = { ...record, ...patch };
      return updated;
    }),
  );
  return updated;
}

export function setMomentFeedback(id: string, feedback: PauseFeedback | undefined) {
  updateMomentRecord(id, { feedback });
}

export function listMomentRecords(): MomentRecord[] {
  return readAll().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function subscribeMomentRecords(callback: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

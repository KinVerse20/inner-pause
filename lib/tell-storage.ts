"use client";

import type { BigMomentMode } from "@/lib/big-moment-engine";
import type { PauseCategoryId } from "@/lib/pause-categories";

// Local persistence for Tell Inner Pause's expressive input — the "Journal
// material" described in docs/PRODUCT_FLOW.md §23/§37 and
// docs/TECHNICAL_ARCHITECTURE.md §4's JournalEntry. Deliberately a fresh,
// lightweight store rather than lib/mvp-storage.ts's JournalEntry (which
// carries the legacy EmotionalAnalysis/HealingPlan chain that
// docs/PRODUCT_FLOW.md no longer describes) — same reasoning that kept
// lib/pause-storage.ts separate from HealingPlan in the Core Pause slice.
// Journal is a *view* over this data, not a separate store (§23) — nothing
// here promotes an entry to a Journey Moment; that's out of this slice's
// scope.

export type TellSource = "write" | "speak";

export interface TellInterpretation {
  status: "confident" | "ambiguous" | "unclear";
  primary: PauseCategoryId | null;
  candidates: PauseCategoryId[];
  confidence: number;
  method: "deterministic" | "ai";
  rationale: string;
  /**
   * A short, honest reflection of what the user actually said — shown above
   * candidate choices in the Ambiguous state so they read as a response to
   * the user's own words, not bare category cards (docs/PRODUCT_FLOW.md §16).
   */
  reflection?: string;
}

export interface TellEntry {
  id: string;
  text: string;
  source: TellSource;
  chips: string[];
  createdAt: string;
  interpretation: TellInterpretation;
  linkedPauseRecordId?: string;
  /**
   * Set when this entry came from "Tell Pause instead" within a Big Moment
   * mode (components/moments-screen.tsx), or from a Return to Me response —
   * the existing Tell/Journal store, not a second one (this slice's brief §4/§13).
   */
  linkedMomentId?: string;
  /** The Big Moment mode this entry was composed within, if any (this slice's brief §4). */
  momentMode?: BigMomentMode;
  /** Set for Practice Session — Tell / Return content (components/practice-session-screen.tsx) — the same Journal store, not a second one. */
  linkedPracticeSessionId?: string;
}

// A Journal entry that isn't routed to a new Pause (a Return to Me response,
// a Practice Tell/Return capture) still deserves an honest interpretation
// value rather than a fabricated routing decision — shared so every such
// call site uses the same neutral marker instead of each inventing its own.
export const NOT_ROUTED_INTERPRETATION: TellInterpretation = {
  status: "confident",
  primary: null,
  candidates: [],
  confidence: 0,
  method: "deterministic",
  rationale: "Not routed to a new Pause.",
};

const STORAGE_KEY = "inner-pause:tell-entries";
const EVENT_NAME = "inner-pause:tell-entries-change";

const isBrowser = () => typeof window !== "undefined";

function readAll(): TellEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TellEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: TellEntry[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function createTellEntry(input: {
  text: string;
  source: TellSource;
  chips: string[];
  interpretation: TellInterpretation;
  momentMode?: BigMomentMode;
  linkedPracticeSessionId?: string;
}): TellEntry {
  const entry: TellEntry = {
    id: crypto.randomUUID(),
    text: input.text,
    source: input.source,
    chips: input.chips,
    createdAt: new Date().toISOString(),
    interpretation: input.interpretation,
    momentMode: input.momentMode,
    linkedPracticeSessionId: input.linkedPracticeSessionId,
  };
  writeAll([...readAll(), entry]);
  return entry;
}

export function getTellEntry(id: string): TellEntry | null {
  return readAll().find((entry) => entry.id === id) ?? null;
}

export function linkTellEntryToPause(id: string, pauseRecordId: string) {
  writeAll(readAll().map((entry) => (entry.id === id ? { ...entry, linkedPauseRecordId: pauseRecordId } : entry)));
}

export function linkTellEntryToMoment(id: string, momentId: string) {
  writeAll(readAll().map((entry) => (entry.id === id ? { ...entry, linkedMomentId: momentId } : entry)));
}

export function listTellEntries(): TellEntry[] {
  return readAll().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Journey — Journal (this slice's brief §3): the user can open an entry and delete it. */
export function deleteTellEntry(id: string) {
  writeAll(readAll().filter((entry) => entry.id !== id));
}

export function subscribeTellEntries(callback: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

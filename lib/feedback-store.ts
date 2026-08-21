"use client";

// You -> Help/About -> "Help us build Pause better" (docs/PRODUCT_FLOW.md
// §28): local-only capture so the control is genuinely functional without
// standing up a real feedback backend in this slice — a dev-safe substitute
// for a future submission endpoint, same spirit as lib/entitlements.ts.
export type FeedbackKind = "feature" | "bug" | "feedback";

export interface FeedbackEntry {
  id: string;
  kind: FeedbackKind;
  message: string;
  createdAt: string;
}

const STORAGE_KEY = "inner-pause:feedback-entries";

const isBrowser = () => typeof window !== "undefined";

function readAll(): FeedbackEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as FeedbackEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function submitFeedback(kind: FeedbackKind, message: string): FeedbackEntry {
  const entry: FeedbackEntry = { id: crypto.randomUUID(), kind, message, createdAt: new Date().toISOString() };
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...readAll()]));
  }
  return entry;
}

export function listFeedback(): FeedbackEntry[] {
  return readAll();
}

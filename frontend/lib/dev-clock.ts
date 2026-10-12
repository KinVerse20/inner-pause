"use client";

// A swappable "now" for local testing of deterministic, time-based rules
// (docs/PRODUCT_FLOW.md §15's Return to Me trigger timing) — without
// waiting for real elapsed time. Real timestamps recorded on records
// (createdAt etc.) always use the real Date; only the "what time is it
// right now, for eligibility comparisons" question goes through this.
//
// Dev-only by construction: the offset is stored in localStorage and only
// ever set by dev-only UI (gated on process.env.NODE_ENV === "development"
// at the call site — see components/moments-screen.tsx). Production builds
// never render the controls that write this key, so the offset stays 0.
const OFFSET_KEY = "inner-pause:dev-now-offset-ms";

const isBrowser = () => typeof window !== "undefined";

export function devNow(): number {
  if (!isBrowser()) return Date.now();
  const raw = window.localStorage.getItem(OFFSET_KEY);
  const offset = raw ? Number(raw) || 0 : 0;
  return Date.now() + offset;
}

export function setDevNowOffsetMs(offsetMs: number) {
  if (!isBrowser()) return;
  window.localStorage.setItem(OFFSET_KEY, String(offsetMs));
}

export function getDevNowOffsetMs(): number {
  if (!isBrowser()) return 0;
  return Number(window.localStorage.getItem(OFFSET_KEY) ?? "0") || 0;
}

export function clearDevNowOffset() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(OFFSET_KEY);
}

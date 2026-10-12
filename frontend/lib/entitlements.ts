"use client";

// The Journey free/paid boundary (docs/PRODUCT_FLOW.md §36,
// docs/TECHNICAL_ARCHITECTURE.md §7) and, this slice, You -> Inner Pause
// Pass's functional entitlement/state model — not final payment
// processing. One product, one price, 60-day duration, no recurring
// subscription (§36). A local/dev activation toggle stands in for real
// purchase/verification so free/active/expired scope-gating is testable
// locally; real payment gateway integration is out of this slice's scope.
const PASS_KEY = "inner-pause:dev-has-pass";
const PASS_ACTIVATED_AT_KEY = "inner-pause:pass-activated-at";
const EVENT_NAME = "inner-pause:entitlements-change";

// §36: "Duration: 60 days."
export const PASS_DURATION_MS = 60 * 24 * 60 * 60 * 1000;

export type PassState = "free" | "active" | "expired";

const isBrowser = () => typeof window !== "undefined";

function readActivatedAt(): number | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(PASS_ACTIVATED_AT_KEY);
  if (!raw) return null;
  const ms = Number(raw);
  return Number.isFinite(ms) ? ms : null;
}

export function getPassState(): PassState {
  const activatedAt = readActivatedAt();
  if (activatedAt === null) return "free";
  return Date.now() - activatedAt < PASS_DURATION_MS ? "active" : "expired";
}

export function getPassExpiresAt(): string | null {
  const activatedAt = readActivatedAt();
  return activatedAt === null ? null : new Date(activatedAt + PASS_DURATION_MS).toISOString();
}

// Never gates on anything but the computed state above — history/Journal/
// Highlights themselves are never touched by expiry (§36's "never delete
// or hide earned history").
export function hasActivePass(): boolean {
  return getPassState() === "active";
}

function write(activatedAtMs: number | null, flagValue: boolean) {
  if (!isBrowser()) return;
  if (activatedAtMs === null) window.localStorage.removeItem(PASS_ACTIVATED_AT_KEY);
  else window.localStorage.setItem(PASS_ACTIVATED_AT_KEY, String(activatedAtMs));
  window.localStorage.setItem(PASS_KEY, flagValue ? "true" : "false");
  window.dispatchEvent(new Event(EVENT_NAME));
}

// Dev-only: activates a fresh 60-day Pass window from now.
export function activateDevPass() {
  write(Date.now(), true);
}

// Dev-only: back-dates activation so the Pass reads as expired, for
// testing the "history remains after expiry" rule without waiting 60 days.
export function expireDevPassForTesting() {
  write(Date.now() - PASS_DURATION_MS - 24 * 60 * 60 * 1000, true);
}

export function clearPass() {
  write(null, false);
}

// Back-compat wrapper for existing callers (components/journey-screen.tsx):
// true activates a fresh Pass, false clears it.
export function setDevHasPass(value: boolean) {
  if (value) activateDevPass();
  else clearPass();
}

export function subscribeEntitlements(callback: () => void) {
  if (!isBrowser()) return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

"use client";

import type { PassState as ServerPassState } from "@inner-pause/shared";

// The free/paid boundary (docs/PRODUCT_FLOW.md §36): the Inner Pause Pass.
// One product, one price, 60 days, no recurring subscription. The Pass is
// bought with Razorpay and held on the user's account on the server
// (backend/src/pass-store.ts); this keeps the server's answer for the
// signed-in account (setServerPass), refreshed on every app load.
//
// In development only, a local toggle (the DEV panels) can also activate a
// Pass, so free/active/expired gating is testable without paying.
const PASS_KEY = "inner-pause:dev-has-pass";
const PASS_ACTIVATED_AT_KEY = "inner-pause:pass-activated-at";
const SERVER_PASS_KEY = "inner-pause:pass";
const EVENT_NAME = "inner-pause:entitlements-change";
const devPassAllowed = process.env.NODE_ENV !== "production";

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

// When the account's Pass ends, as the server last reported it.
function readServerExpiry(): number | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SERVER_PASS_KEY);
    const expiresAt = raw ? (JSON.parse(raw) as { expiresAt?: string | null }).expiresAt : null;
    const ms = expiresAt ? Date.parse(expiresAt) : NaN;
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
}

// The later of the account's Pass and (development only) the dev toggle.
function latestExpiry(): number | null {
  const devActivatedAt = devPassAllowed ? readActivatedAt() : null;
  const candidates = [readServerExpiry(), devActivatedAt === null ? null : devActivatedAt + PASS_DURATION_MS].filter(
    (value): value is number => value !== null,
  );
  return candidates.length ? Math.max(...candidates) : null;
}

export function getPassState(): PassState {
  const expiry = latestExpiry();
  if (expiry === null) return "free";
  return Date.now() < expiry ? "active" : "expired";
}

export function getPassExpiresAt(): string | null {
  const expiry = latestExpiry();
  return expiry === null ? null : new Date(expiry).toISOString();
}

/** Records the server's Pass for the signed-in account (null when signed out). */
export function setServerPass(pass: ServerPassState | null | undefined) {
  if (!isBrowser()) return;
  if (pass?.expiresAt) window.localStorage.setItem(SERVER_PASS_KEY, JSON.stringify({ expiresAt: pass.expiresAt }));
  else window.localStorage.removeItem(SERVER_PASS_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
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

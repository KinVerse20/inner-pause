"use client";

import { useSyncExternalStore } from "react";
import { TRIAL_COUNTS_AFTER_SECONDS, type PassState } from "@inner-pause/shared";

import { getAccount, subscribeAccount } from "@/lib/account-store";
import { apiFetch } from "@/lib/api";
import { getTrial, hasActivePass, setServerPass, subscribeEntitlements, trialPausesLeft } from "@/lib/entitlements";

// The trial (docs/COMMERCIAL_PLAN.md C2): no free version, so a Pause needs
// an account, and then the Pass or a trial Pause left. The server counts
// each trial Pause once it has played TRIAL_COUNTS_AFTER_SECONDS (or ended,
// if it's shorter); it's the one that decides (backend/src/pass-store.ts).

export type PauseAccess = "ok" | "sign-in" | "pass";

/**
 * Whether a Pause may start. One the trial already counted can always be
 * finished or played again; one already playing is never cut off (the
 * player doesn't ask again for the Pause the session holds).
 */
export function pauseAccess(pauseId: string): PauseAccess {
  if (hasActivePass()) return "ok";
  if (!getAccount()) return "sign-in";
  if (getTrial().pauseIds.includes(pauseId) || trialPausesLeft() > 0) return "ok";
  return "pass";
}

/**
 * Everything else the app does (writing in the journal, telling it what's
 * on your mind, the Return to Me check in) sits behind the Pass too: open
 * while the trial has a Pause left, closed once it's used. Reading what
 * you already saved is never closed (§36).
 */
export function appAccess(): PauseAccess {
  if (hasActivePass()) return "ok";
  if (!getAccount()) return "sign-in";
  return trialPausesLeft() > 0 ? "ok" : "pass";
}

function subscribeAccess(callback: () => void) {
  const offPass = subscribeEntitlements(callback);
  const offAccount = subscribeAccount(callback);
  return () => {
    offPass();
    offAccount();
  };
}

/**
 * appAccess() as React state: null on the server and the first paint (it
 * lives in this browser), then the answer, kept current as the account
 * and the Pass sync from the server.
 */
export function useAppAccess(): PauseAccess | null {
  return useSyncExternalStore(subscribeAccess, appAccess, () => null);
}

/** Whether a Pause on the trial is one the trial is still to count. */
export function isUncountedTrialPause(pauseId: string) {
  return !hasActivePass() && Boolean(getAccount()) && !getTrial().pauseIds.includes(pauseId);
}

/** How long a Pause plays before the trial counts it: 2 minutes, or all of a shorter one. */
export function trialCountsAfter(durationSeconds: number) {
  return Math.min(TRIAL_COUNTS_AFTER_SECONDS, durationSeconds);
}

const inFlight = new Set<string>();

/**
 * Tells the server a Pause has played long enough to count. Safe to call
 * repeatedly: once counted (or with a Pass) it does nothing, and a failed
 * call (offline) is tried again on the next one.
 */
export async function countTrialPause(pauseId: string) {
  if (!isUncountedTrialPause(pauseId) || inFlight.has(pauseId)) return;
  inFlight.add(pauseId);
  try {
    const response = await apiFetch("/api/pass/trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pauseId }),
    });
    // 402: the trial was already used up elsewhere. This Pause still plays to its end.
    if (response.ok || response.status === 402) {
      const { pass } = (await response.json()) as { pass: PassState };
      setServerPass(pass);
    }
  } catch {
    // Offline: the next listening save tries again.
  } finally {
    inFlight.delete(pauseId);
  }
}

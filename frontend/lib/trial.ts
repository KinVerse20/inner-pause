"use client";

import { useSyncExternalStore } from "react";
import type { PassState } from "@inner-pause/shared";

import { getAccount, subscribeAccount } from "@/lib/account-store";
import { apiFetch } from "@/lib/api";
import { getTrial, hasActivePass, setServerPass, subscribeEntitlements, trialPausesLeft } from "@/lib/entitlements";

// The trial (docs/COMMERCIAL_PLAN.md C2): no free version, so a Pause needs
// an account, and then the Pass or a trial Pause left. A trial Pause counts
// when the listener confirms starting it, however long they then listen;
// the server is the one that decides (backend/src/pass-store.ts).

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

export type TrialStart = "ok" | "used-up" | "sign-in" | "offline";

/**
 * Uses a trial Pause, once the listener has confirmed. "ok" to play it;
 * "used-up" when the trial was already used (on another device, say);
 * "offline" when the server couldn't be reached, so nothing is counted and
 * nothing plays.
 */
export async function startTrialPause(pauseId: string): Promise<TrialStart> {
  if (!isUncountedTrialPause(pauseId)) return "ok";
  try {
    const response = await apiFetch("/api/pass/trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pauseId }),
    });
    if (response.status === 401) return "sign-in";
    if (!response.ok && response.status !== 402) return "offline";
    const { pass } = (await response.json()) as { pass: PassState };
    setServerPass(pass);
    return response.ok ? "ok" : "used-up";
  } catch {
    return "offline";
  }
}

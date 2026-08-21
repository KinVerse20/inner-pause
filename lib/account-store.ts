"use client";

// Local dev-safe substitute for a real account/session model
// (docs/PRODUCT_FLOW.md §27: "Account — Profile · Login · Inner Pause
// Pass"). Real Supabase auth already exists (lib/supabase/*) but is
// dormant in this environment (empty env keys) and its UI
// (components/auth-screen.tsx) is explicitly out of scope for this slice —
// Entry/Onboarding/Auth cleanup is a separate future pass. This gives
// You -> Account real signed-out/signed-in states to build and test
// against now, without inventing a different product flow or reusing
// lib/mvp-storage.ts's onboarding-coupled HealingProfile shape.
export interface LocalAccount {
  id: string;
  displayName: string;
  email?: string;
  signedInAt: string;
}

const ACCOUNT_KEY = "inner-pause:local-account";
const EVENT_NAME = "inner-pause:account-change";

const isBrowser = () => typeof window !== "undefined";

export function getAccount(): LocalAccount | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as LocalAccount) : null;
  } catch {
    return null;
  }
}

export function signInDev(displayName: string, email?: string): LocalAccount {
  const account: LocalAccount = {
    id: crypto.randomUUID(),
    displayName: displayName.trim() || "You",
    email: email?.trim() || undefined,
    signedInAt: new Date().toISOString(),
  };
  if (isBrowser()) {
    window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    window.dispatchEvent(new Event(EVENT_NAME));
  }
  return account;
}

export function signOut() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCOUNT_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeAccount(callback: () => void) {
  if (!isBrowser()) return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

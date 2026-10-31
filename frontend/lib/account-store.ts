"use client";

import type { PassState } from "@inner-pause/shared";

import { setServerPass } from "@/lib/entitlements";

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

export function applyServerAccount(user: { id: string; email: string; fullName: string; pass?: PassState }): LocalAccount {
  // The account's Pass travels with it (lib/entitlements.ts).
  setServerPass(user.pass ?? null);
  const account: LocalAccount = {
    id: user.id,
    displayName: user.fullName.trim() || user.email || "You",
    email: user.email,
    signedInAt: getAccount()?.id === user.id ? getAccount()?.signedInAt ?? new Date().toISOString() : new Date().toISOString(),
  };
  if (isBrowser()) {
    window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    window.dispatchEvent(new Event(EVENT_NAME));
  }
  return account;
}

export function clearAccount() {
  if (!isBrowser()) return;
  setServerPass(null);
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

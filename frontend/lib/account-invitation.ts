"use client";

// The post-value "Want to keep your Journey?" invitation
// (docs/PRODUCT_FLOW.md §39.B, docs/UX_ARCHITECTURE.md §10): shown at most
// once, ever, per device — "Not now" is a complete, permanent, first-class
// state, never a nag loop. A dedicated flag rather than reusing
// lib/mvp-storage.ts's onboarding fields, since "seen the invitation" is a
// distinct concept from "has entered the app" (components/entry-gate.tsx).
const DISMISSED_KEY = "inner-pause:account-invitation-dismissed";

const isBrowser = () => typeof window !== "undefined";

export function hasDismissedAccountInvitation(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(DISMISSED_KEY) === "true";
}

export function dismissAccountInvitation() {
  if (!isBrowser()) return;
  window.localStorage.setItem(DISMISSED_KEY, "true");
}

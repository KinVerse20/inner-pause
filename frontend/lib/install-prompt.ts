"use client";

// Installing Inner Pause as an app (docs/COMMERCIAL_PLAN.md C5). Android
// Chrome (and desktop Chrome/Edge) offer a real install prompt through the
// beforeinstallprompt event, which can fire before the page is ready for
// it, so it's caught here as soon as this module loads. iPhone Safari has no
// prompt: people add it from the Share menu.

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export const canPromptInstall = () => deferred !== null;
export const justInstalled = () => installed;

export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Shows the browser's install prompt. Resolves true if they installed. */
export async function promptInstall() {
  const event = deferred;
  if (!event) return false;
  deferred = null;
  await event.prompt();
  const choice = await event.userChoice;
  if (choice.outcome === "accepted") installed = true;
  notify();
  return choice.outcome === "accepted";
}

/** Already running as the installed app (opened from the home screen). */
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export type InstallPlatform = "ios" | "android" | "desktop";

export function installPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "desktop";
  const agent = window.navigator.userAgent;
  // iPadOS reports itself as a Mac; a touch screen gives it away.
  if (/iphone|ipad|ipod/i.test(agent) || (/macintosh/i.test(agent) && window.navigator.maxTouchPoints > 1)) return "ios";
  if (/android/i.test(agent)) return "android";
  return "desktop";
}

const SOURCE_KEY = "inner-pause:install-source";

/** Keeps the ad's utm_* tags from the first visit, so sign up can record where people came from. */
export function rememberSource(search: string) {
  try {
    const params = new URLSearchParams(search);
    const tags = Object.fromEntries([...params].filter(([key]) => key.startsWith("utm_")).map(([key, value]) => [key, value.slice(0, 100)]));
    if (Object.keys(tags).length && !window.localStorage.getItem(SOURCE_KEY)) {
      window.localStorage.setItem(SOURCE_KEY, JSON.stringify({ ...tags, landedAt: new Date().toISOString() }));
    }
  } catch {
    // Storage blocked: nothing to remember.
  }
}

export function readSource(): Record<string, string> | null {
  try {
    const raw = window.localStorage.getItem(SOURCE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

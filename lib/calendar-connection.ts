"use client";

// You -> Calendar (docs/PRODUCT_FLOW.md §32): a connection/settings state
// only, not the real Google OAuth integration — "connect" here is a
// dev-safe simulated success, same spirit as lib/entitlements.ts's dev
// Pass toggle. Manual Big Moments (lib/big-moment-engine.ts) never read
// this state and keep working identically whether connected or not.
export interface CalendarConnectionState {
  connected: boolean;
  connectedAt?: string;
  disconnectedAt?: string;
}

export const DEFAULT_CALENDAR_CONNECTION: CalendarConnectionState = { connected: false };

const STORAGE_KEY = "inner-pause:calendar-connection";
const EVENT_NAME = "inner-pause:calendar-connection-change";

const isBrowser = () => typeof window !== "undefined";

export function getCalendarConnection(): CalendarConnectionState {
  if (!isBrowser()) return DEFAULT_CALENDAR_CONNECTION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CALENDAR_CONNECTION, ...(JSON.parse(raw) as Partial<CalendarConnectionState>) } : DEFAULT_CALENDAR_CONNECTION;
  } catch {
    return DEFAULT_CALENDAR_CONNECTION;
  }
}

function write(next: CalendarConnectionState) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function connectCalendarDev() {
  write({ connected: true, connectedAt: new Date().toISOString() });
}

export function disconnectCalendar() {
  write({ connected: false, disconnectedAt: new Date().toISOString() });
}

export function subscribeCalendarConnection(callback: () => void) {
  if (!isBrowser()) return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

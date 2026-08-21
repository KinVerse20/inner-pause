"use client";

// You -> Notifications (docs/PRODUCT_FLOW.md §31): preference/state storage
// only — no real push infrastructure in this slice. Category set is the
// four this slice's brief names explicitly (Practice, Return to Me,
// Calendar, Gentle Pause); tap-destination routing and real delivery are
// later integration work (docs/TECHNICAL_ARCHITECTURE.md §13).
export type NotificationCategory = "practice" | "return-to-me" | "calendar" | "gentle-pause";

export const NOTIFICATION_CATEGORIES: Array<{ id: NotificationCategory; label: string; description: string }> = [
  { id: "practice", label: "Practice", description: "Help continue a chosen practice." },
  { id: "return-to-me", label: "Return to Me", description: "Follow up on meaningful moments." },
  { id: "calendar", label: "Calendar", description: "Prepare for an upcoming meaningful event." },
  {
    id: "gentle-pause",
    label: "Gentle Pause",
    description: "Something small, with nothing asked back. No CTA, no streak.",
  },
];

// Local representation, deliberately distinct from the real browser
// Notification.permission API — "not-asked" vs "declined" needs to survive
// even where the browser API is unavailable (SSR, unsupported browsers),
// and "declined" here means the in-product prompt was answered "Not now,"
// not necessarily the OS-level permission (§31: "Yes, send them / Not now").
export type NotificationPermissionState = "not-asked" | "enabled" | "declined";

export interface NotificationPreferencesState {
  permission: NotificationPermissionState;
  categories: Record<NotificationCategory, boolean>;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencesState = {
  permission: "not-asked",
  categories: {
    practice: true,
    "return-to-me": true,
    calendar: true,
    "gentle-pause": true,
  },
};

const STORAGE_KEY = "inner-pause:notification-preferences";
const EVENT_NAME = "inner-pause:notification-preferences-change";

const isBrowser = () => typeof window !== "undefined";

export function getNotificationPreferences(): NotificationPreferencesState {
  if (!isBrowser()) return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<NotificationPreferencesState>;
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed, categories: { ...DEFAULT_NOTIFICATION_PREFERENCES.categories, ...parsed.categories } };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

function write(next: NotificationPreferencesState) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function setNotificationPermission(permission: NotificationPermissionState) {
  write({ ...getNotificationPreferences(), permission });
}

export function setCategoryEnabled(category: NotificationCategory, enabled: boolean) {
  const current = getNotificationPreferences();
  write({ ...current, categories: { ...current.categories, [category]: enabled } });
}

export function subscribeNotificationPreferences(callback: () => void) {
  if (!isBrowser()) return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

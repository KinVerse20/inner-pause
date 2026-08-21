"use client";

// You -> Preferences (docs/PRODUCT_FLOW.md §27): theme, sound, practice,
// and offline preferences, deliberately kept to the currently defined
// settings only — not the legacy lib/mvp-storage.ts sound/voice/guidance
// taxonomy, which is onboarding-coupled and larger than this slice's brief
// calls for.
export type ThemePreference = "system" | "light" | "dark";

// Reuses the exact option vocabulary already shown to users in Practice's
// "adaptation" check-in tier (lib/practice-content.ts) so the global
// default and the in-flow question speak the same language.
export type PracticeSupportPreference =
  | "shorter-sessions"
  | "more-sound"
  | "more-writing"
  | "keep-going-as-is";

export const PRACTICE_SUPPORT_OPTIONS: Array<{ id: PracticeSupportPreference; label: string }> = [
  { id: "shorter-sessions", label: "Shorter sessions" },
  { id: "more-sound", label: "More sound, less writing" },
  { id: "more-writing", label: "More writing, less sound" },
  { id: "keep-going-as-is", label: "Keep going as-is" },
];

export interface PreferencesState {
  theme: ThemePreference;
  soundAmbientEnabled: boolean;
  soundVoiceGuidanceEnabled: boolean;
  practicePreferredSupport: PracticeSupportPreference | null;
  offlineEnabled: boolean;
}

export const DEFAULT_PREFERENCES: PreferencesState = {
  theme: "system",
  soundAmbientEnabled: true,
  soundVoiceGuidanceEnabled: true,
  practicePreferredSupport: null,
  offlineEnabled: false,
};

const STORAGE_KEY = "inner-pause:preferences";
const EVENT_NAME = "inner-pause:preferences-change";

const isBrowser = () => typeof window !== "undefined";

export function getPreferences(): PreferencesState {
  if (!isBrowser()) return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<PreferencesState>) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function updatePreferences(patch: Partial<PreferencesState>): PreferencesState {
  const next = { ...getPreferences(), ...patch };
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT_NAME));
  }
  return next;
}

export function subscribePreferences(callback: () => void) {
  if (!isBrowser()) return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

"use client";

import { DEFAULT_BUILT_IN_SOUND, type BuiltInSoundId, type UndertoneLevel } from "@/lib/sound-library";
// You -> Preferences (docs/PRODUCT_FLOW.md §27): theme, sound, practice,
// and offline preferences, deliberately kept to the currently defined
// settings only — not the legacy lib/mvp-storage.ts sound/voice/guidance
// taxonomy, which is onboarding-coupled and larger than this slice's brief
// calls for.
export type ThemePreference = "system" | "light" | "dark";

/** The language Speak listens for. Hindi is shown in English letters (lib/hinglish.ts). */
export type SpeechLanguage = "en" | "hi";

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
  /**
   * "Frequency": tunes a Pause's sound to its frequency (lib/use-tuned-sound.ts),
   * or plays a soft tone at it when the Pause has no sound (lib/use-tone-layer.ts).
   */
  soundToneLayerEnabled: boolean;
  /** Built-in sound a Pause starts with when its card has none (lib/sound-library.ts). */
  defaultSound: BuiltInSoundId;
  /** How present the frequency undertone is beneath a built-in sound. */
  undertone: UndertoneLevel;
  practicePreferredSupport: PracticeSupportPreference | null;
  offlineEnabled: boolean;
  /** Missing until chosen: then it follows the device's language. */
  speechLanguage?: SpeechLanguage;
  /** The player's breathing exercise (4 in, 6 out) was on last time: a Pause starts with it. */
  breathingExercise?: boolean;
}

/** The language Speak listens for: the one you chose, or Hindi if the device is set to it. */
export function speechLanguage(preferences: PreferencesState = getPreferences()): SpeechLanguage {
  if (preferences.speechLanguage) return preferences.speechLanguage;
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("hi") ? "hi" : "en";
}

export const DEFAULT_PREFERENCES: PreferencesState = {
  theme: "system",
  soundAmbientEnabled: true,
  soundVoiceGuidanceEnabled: true,
  soundToneLayerEnabled: true,
  defaultSound: DEFAULT_BUILT_IN_SOUND,
  undertone: "balanced",
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

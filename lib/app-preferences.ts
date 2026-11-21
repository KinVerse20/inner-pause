"use client";

import { readProgress, writeProgress } from "@/lib/storage";
import { AppPreferences, ChakraId, QuickHistoryEntry, QuickPlayDuration, RelaxMoodId } from "@/lib/types";
import { chakraMap, relaxMoodMap } from "@/data/chakras";

const APP_PREFERENCES_KEY = "chakra-app-preferences";
const APP_PREFERENCES_EVENT = "chakra-app-preferences-change";

export const defaultAppPreferences: AppPreferences = {
  lastSelectedDuration: 20,
  favouriteMoodIds: [],
  favouriteChakraIds: [],
  quickHistory: [],
  lastPlayed: null,
};

let cachedRaw: string | null = null;
let cachedPreferences: AppPreferences = defaultAppPreferences;

const isBrowser = () => typeof window !== "undefined";

export const readAppPreferences = (): AppPreferences => {
  if (!isBrowser()) return defaultAppPreferences;

  try {
    const raw = window.localStorage.getItem(APP_PREFERENCES_KEY);
    if (!raw) {
      cachedRaw = null;
      cachedPreferences = defaultAppPreferences;
      return cachedPreferences;
    }

    if (raw === cachedRaw) return cachedPreferences;

    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    cachedRaw = raw;
    cachedPreferences = {
      ...defaultAppPreferences,
      ...parsed,
      favouriteMoodIds: parsed.favouriteMoodIds ?? [],
      favouriteChakraIds: parsed.favouriteChakraIds ?? [],
      quickHistory: parsed.quickHistory ?? [],
      lastPlayed: parsed.lastPlayed ?? null,
    };
    return cachedPreferences;
  } catch {
    return defaultAppPreferences;
  }
};

export const writeAppPreferences = (preferences: AppPreferences) => {
  if (!isBrowser()) return;
  const raw = JSON.stringify(preferences);
  if (raw === cachedRaw) return;
  window.localStorage.setItem(APP_PREFERENCES_KEY, raw);
  cachedRaw = raw;
  cachedPreferences = preferences;
  window.dispatchEvent(new Event(APP_PREFERENCES_EVENT));
};

export const subscribeToAppPreferences = (callback: () => void) => {
  if (!isBrowser()) return () => {};

  const handler = () => callback();
  const storageHandler = (event: StorageEvent) => {
    if (event.key === APP_PREFERENCES_KEY) callback();
  };

  window.addEventListener(APP_PREFERENCES_EVENT, handler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(APP_PREFERENCES_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
};

export const toggleFavouriteMood = (moodId: RelaxMoodId) => {
  const preferences = readAppPreferences();
  const favouriteMoodIds = preferences.favouriteMoodIds.includes(moodId)
    ? preferences.favouriteMoodIds.filter((item) => item !== moodId)
    : [...preferences.favouriteMoodIds, moodId];

  writeAppPreferences({ ...preferences, favouriteMoodIds });
};

export const toggleFavouriteChakra = (chakraId: ChakraId) => {
  const preferences = readAppPreferences();
  const favouriteChakraIds = preferences.favouriteChakraIds.includes(chakraId)
    ? preferences.favouriteChakraIds.filter((item) => item !== chakraId)
    : [...preferences.favouriteChakraIds, chakraId];

  writeAppPreferences({ ...preferences, favouriteChakraIds });
};

export const setLastSelectedDuration = (duration: QuickPlayDuration) => {
  const preferences = readAppPreferences();
  if (preferences.lastSelectedDuration === duration) return;
  writeAppPreferences({ ...preferences, lastSelectedDuration: duration });
};

export const recordQuickSession = ({
  chakraId,
  duration,
  listenedMinutes,
  moodId,
}: {
  chakraId: ChakraId;
  duration: QuickPlayDuration;
  listenedMinutes: number;
  moodId?: RelaxMoodId;
}) => {
  const chakra = chakraMap[chakraId];
  const mood = moodId ? relaxMoodMap[moodId] : undefined;
  const now = new Date().toISOString();
  const durationLabel =
    duration === "keep-playing" ? "Keep playing" : `${duration} minutes`;

  const entry: QuickHistoryEntry = {
    id: `${chakraId}-${Date.now()}`,
    type: "quick",
    chakraId,
    chakraName: chakra.name,
    moodId,
    moodLabel: mood?.label,
    durationLabel,
    listenedMinutes,
    completedAt: now,
  };

  const preferences = readAppPreferences();
  writeAppPreferences({
    ...preferences,
    quickHistory: [entry, ...preferences.quickHistory].slice(0, 40),
    lastPlayed: {
      chakraId,
      chakraName: chakra.name,
      moodId,
      moodLabel: mood?.label,
      duration,
      completedAt: now,
    },
  });

  if (listenedMinutes > 0) {
    const progress = readProgress();
    writeProgress({
      ...progress,
      totalMinutes: progress.totalMinutes + listenedMinutes,
    });
  }
};

"use client";

import { defaultProgress, STORAGE_KEY } from "@/lib/progress";
import { ProgressState } from "@/lib/types";

const isBrowser = () => typeof window !== "undefined";
const STORAGE_EVENT = "chakra-progress-change";

let cachedRaw: string | null = null;
let cachedProgress: ProgressState = defaultProgress;

export const readProgress = (): ProgressState => {
  if (!isBrowser()) return defaultProgress;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedRaw = null;
      cachedProgress = defaultProgress;
      return cachedProgress;
    }

    if (raw === cachedRaw) return cachedProgress;

    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    cachedRaw = raw;
    cachedProgress = {
      ...defaultProgress,
      ...parsed,
      completedSessionKeys: parsed.completedSessionKeys ?? [],
      history: parsed.history ?? [],
      badges: parsed.badges ?? [],
    };
    return cachedProgress;
  } catch {
    return defaultProgress;
  }
};

export const writeProgress = (progress: ProgressState) => {
  if (!isBrowser()) return;
  const raw = JSON.stringify(progress);
  if (raw === cachedRaw) return;
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedProgress = progress;
  window.dispatchEvent(new Event(STORAGE_EVENT));
};

export const resetProgress = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  cachedRaw = null;
  cachedProgress = defaultProgress;
  window.dispatchEvent(new Event(STORAGE_EVENT));
};

export const subscribeToProgress = (callback: () => void) => {
  if (!isBrowser()) return () => {};

  const handler = () => callback();
  const storageHandler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };

  window.addEventListener(STORAGE_EVENT, handler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(STORAGE_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
};

"use client";

import { useSyncExternalStore } from "react";

import { defaultProgress } from "@/lib/progress";
import { readProgress, subscribeToProgress } from "@/lib/storage";

export const useProgressStore = () =>
  useSyncExternalStore(subscribeToProgress, readProgress, () => defaultProgress);

export const useHydrated = () =>
  useSyncExternalStore(() => () => {}, () => true, () => false);

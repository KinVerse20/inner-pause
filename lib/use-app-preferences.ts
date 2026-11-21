"use client";

import { useSyncExternalStore } from "react";

import { defaultAppPreferences, readAppPreferences, subscribeToAppPreferences } from "@/lib/app-preferences";

export const useAppPreferences = () =>
  useSyncExternalStore(subscribeToAppPreferences, readAppPreferences, () => defaultAppPreferences);

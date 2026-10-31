"use client";

import { useEffect } from "react";

import { refreshAppContent } from "@/lib/content-store";
import { downloadPauseSoundsForOffline } from "@/lib/offline-audio";
import { getPreferences } from "@/lib/preferences-store";

// Pulls the latest admin content once per app load — same mount-once,
// render-nothing pattern as components/auth-session-sync.tsx. With
// offline on, also downloads any card sound that's new since (quietly:
// offline, it simply finds nothing new to fetch).
export function ContentSync() {
  useEffect(() => {
    void refreshAppContent().then(() => {
      if (getPreferences().offlineEnabled) downloadPauseSoundsForOffline().catch(() => {});
    });
  }, []);
  return null;
}

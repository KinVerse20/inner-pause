"use client";

import { useEffect } from "react";

import { startJournalSync } from "@/lib/journal-sync";

// Keeps the optional journal backup in step while the app is open
// (lib/journal-sync.ts). Does nothing unless the backup is on.
export function JournalSyncAgent() {
  useEffect(() => startJournalSync(), []);
  return null;
}

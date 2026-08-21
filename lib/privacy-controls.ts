"use client";

// You -> Data & Privacy (docs/PRODUCT_FLOW.md §35): "Your Inner Pause
// belongs to you." Reads/clears the existing local-first stores directly
// by key rather than adding a duplicate persistence system — deletion here
// is real, scoped to the stores this project has actually implemented
// (Journal/Highlights/Patterns/Practice/Pause/entitlements/the new You
// preference stores). The legacy pre-locked-docs onboarding/profile model
// (lib/mvp-storage.ts's "chakra-healing-mvp" key) is intentionally out of
// scope — Entry/Onboarding/Auth cleanup is a separate future pass.
import { listMomentRecords, type MomentRecord } from "@/lib/moment-storage";
import { listPatterns, type PatternRecord } from "@/lib/pattern-storage";
import { listPauseRecords, type PauseRecord } from "@/lib/pause-storage";
import {
  listPracticeCheckIns,
  listPracticeSessionRecords,
  listEnrollments,
  type PracticeCheckInRecord,
  type PracticeEnrollment,
  type PracticeSessionRecord,
} from "@/lib/practice-storage";
import { deleteTellEntry, listTellEntries, type TellEntry } from "@/lib/tell-storage";
import { signOut } from "@/lib/account-store";

const isBrowser = () => typeof window !== "undefined";

const JOURNEY_DATA_KEYS = [
  "inner-pause:tell-entries",
  "inner-pause:moment-records",
  "inner-pause:pattern-records",
  "inner-pause:pattern-generation-meta",
];

const ALL_LOCAL_DATA_KEYS = [
  ...JOURNEY_DATA_KEYS,
  "inner-pause:pause-records",
  "inner-pause:practice-enrollments",
  "inner-pause:practice-sessions",
  "inner-pause:practice-checkins",
  "inner-pause:dev-has-pass",
  "inner-pause:pass-activated-at",
  "inner-pause:local-account",
  "inner-pause:preferences",
  "inner-pause:notification-preferences",
  "inner-pause:calendar-connection",
  "inner-pause:dev-now-offset-ms",
  "inner-pause:feedback-entries",
  "inner-pause:pattern-analysis-consent",
];

// ---------- AI / pattern-analysis consent ----------

const CONSENT_KEY = "inner-pause:pattern-analysis-consent";

export function getPatternAnalysisConsent(): boolean {
  if (!isBrowser()) return true;
  const raw = window.localStorage.getItem(CONSENT_KEY);
  return raw === null ? true : raw === "true";
}

export function setPatternAnalysisConsent(value: boolean) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CONSENT_KEY, value ? "true" : "false");
}

// ---------- What Inner Pause remembers (plain-language summary) ----------

export interface DataSummary {
  journalEntryCount: number;
  momentCount: number;
  patternCount: number;
  practiceSessionCount: number;
  pauseCount: number;
}

export function getDataSummary(): DataSummary {
  return {
    journalEntryCount: listTellEntries().length,
    momentCount: listMomentRecords().length,
    patternCount: listPatterns().length,
    practiceSessionCount: listPracticeSessionRecords().length,
    pauseCount: listPauseRecords().length,
  };
}

// ---------- Export ----------

interface ExportBundle {
  exportedAt: string;
  journal: TellEntry[];
  moments: MomentRecord[];
  patterns: PatternRecord[];
  pauses: PauseRecord[];
  practice: {
    enrollments: PracticeEnrollment[];
    sessions: PracticeSessionRecord[];
    checkIns: PracticeCheckInRecord[];
  };
}

export function buildExportBundle(): ExportBundle {
  return {
    exportedAt: new Date().toISOString(),
    journal: listTellEntries(),
    moments: listMomentRecords(),
    patterns: listPatterns(),
    pauses: listPauseRecords(),
    practice: {
      enrollments: listEnrollments(),
      sessions: listPracticeSessionRecords(),
      checkIns: listPracticeCheckIns(),
    },
  };
}

export function exportAllDataAsFile() {
  if (!isBrowser()) return;
  const bundle = buildExportBundle();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `inner-pause-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------- Deletion ----------

// Delete a single Journal entry — the same operation Journey's own
// Journal detail already exposes; re-exported here so Data & Privacy is a
// complete, honest surface on its own.
export function deleteJournalEntry(id: string) {
  deleteTellEntry(id);
}

export function deleteJourneyData() {
  if (!isBrowser()) return;
  for (const key of JOURNEY_DATA_KEYS) window.localStorage.removeItem(key);
}

export function deleteAllLocalData() {
  if (!isBrowser()) return;
  for (const key of ALL_LOCAL_DATA_KEYS) window.localStorage.removeItem(key);
  signOut();
}

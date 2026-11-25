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
import { readProgrammeState, type ProgrammeState } from "@/lib/programme-storage";
import { deleteTellEntry, listTellEntries, type TellEntry } from "@/lib/tell-storage";
import { JOURNAL_BACKUP_KEY, JOURNAL_TOMBSTONES_KEY, JOURNAL_WIPE_PENDING_KEY, wipeJournalBackupWithJourney } from "@/lib/journal-sync";
import { clearAccount } from "@/lib/account-store";
import { logout } from "@/lib/auth-client";

const isBrowser = () => typeof window !== "undefined";

// The retired seven-skill Practice kept its records under these keys. No
// screen writes them any more, but a device that used it still holds them:
// they stay in the summary, the export and the delete, read as stored.
const LEGACY_PRACTICE_KEYS = {
  enrollments: "inner-pause:practice-enrollments",
  sessions: "inner-pause:practice-sessions",
  checkIns: "inner-pause:practice-checkins",
} as const;

function readLegacyPractice(key: string): unknown[] {
  if (!isBrowser()) return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const JOURNEY_DATA_KEYS = [
  "inner-pause:tell-entries",
  "inner-pause:moment-records",
  "inner-pause:pattern-records",
  "inner-pause:pattern-generation-meta",
];

const ALL_LOCAL_DATA_KEYS = [
  ...JOURNEY_DATA_KEYS,
  "inner-pause:pause-records",
  LEGACY_PRACTICE_KEYS.enrollments,
  LEGACY_PRACTICE_KEYS.sessions,
  LEGACY_PRACTICE_KEYS.checkIns,
  // The five Practice paths (lib/programme-storage.ts) and a reminder
  // subscription waiting to reach the server.
  "innerpause-practices-v1",
  "innerpause-pending-push-subscription",
  "inner-pause:dev-has-pass",
  "inner-pause:pass-activated-at",
  "inner-pause:local-account",
  "inner-pause:preferences",
  "inner-pause:notification-preferences",
  "inner-pause:calendar-connection",
  "inner-pause:dev-now-offset-ms",
  "inner-pause:feedback-entries",
  "inner-pause:pattern-analysis-consent",
  JOURNAL_BACKUP_KEY,
  JOURNAL_TOMBSTONES_KEY,
  JOURNAL_WIPE_PENDING_KEY,
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
    // Days completed on Practice paths, plus any older skill sessions.
    practiceSessionCount:
      readProgrammeState().enrollments.reduce((sum, enrollment) => sum + enrollment.completions.length, 0) +
      readLegacyPractice(LEGACY_PRACTICE_KEYS.sessions).length,
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
  /** The retired seven-skill Practice, as stored (empty on newer devices). */
  practice: {
    enrollments: unknown[];
    sessions: unknown[];
    checkIns: unknown[];
  };
  /** The five Practice paths: enrollments, daily check-ins, completions. */
  practicePaths: ProgrammeState;
}

export function buildExportBundle(): ExportBundle {
  return {
    exportedAt: new Date().toISOString(),
    journal: listTellEntries(),
    moments: listMomentRecords(),
    patterns: listPatterns(),
    pauses: listPauseRecords(),
    practice: {
      enrollments: readLegacyPractice(LEGACY_PRACTICE_KEYS.enrollments),
      sessions: readLegacyPractice(LEGACY_PRACTICE_KEYS.sessions),
      checkIns: readLegacyPractice(LEGACY_PRACTICE_KEYS.checkIns),
    },
    practicePaths: readProgrammeState(),
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
  // With the journal backup on, the account copy goes too.
  wipeJournalBackupWithJourney();
  for (const key of JOURNEY_DATA_KEYS) window.localStorage.removeItem(key);
}

export async function deleteAllLocalData() {
  if (!isBrowser()) return;
  for (const key of ALL_LOCAL_DATA_KEYS) window.localStorage.removeItem(key);
  clearAccount();
  await logout().catch(() => undefined);
}

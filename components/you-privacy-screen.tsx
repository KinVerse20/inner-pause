"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PauseShell } from "@/components/pause-shell";
import { SettingsSectionTitle, YouScreenHeader } from "@/components/settings-row";
import { ToggleSwitch } from "@/components/toggle-switch";
import {
  deleteAllLocalData,
  deleteJournalEntry,
  deleteJourneyData,
  exportAllDataAsFile,
  getDataSummary,
  getPatternAnalysisConsent,
  setPatternAnalysisConsent,
  type DataSummary,
} from "@/lib/privacy-controls";
import { listTellEntries, type TellEntry } from "@/lib/tell-storage";

// You -> Data & Privacy (docs/PRODUCT_FLOW.md §35): "Your Inner Pause
// belongs to you." Plain language, real deletion for the stores this
// project has actually implemented, real export, and an AI/pattern
// consent control that genuinely gates future pattern generation
// (components/journey-screen.tsx).
export function YouPrivacyScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [consent, setConsent] = useState(true);
  const [recentEntries, setRecentEntries] = useState<TellEntry[]>([]);

  const refresh = () => {
    setSummary(getDataSummary());
    setConsent(getPatternAnalysisConsent());
    setRecentEntries(listTellEntries().slice(0, 5));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const handleDeleteEntry = (id: string) => {
    deleteJournalEntry(id);
    refresh();
  };

  const handleDeleteJourneyData = () => {
    if (!window.confirm("Delete all Journal, Highlights, and Patterns? This can't be undone.")) return;
    deleteJourneyData();
    refresh();
  };

  const handleDeleteAccount = () => {
    if (!window.confirm("Delete your account and all local Inner Pause data on this device? This can't be undone.")) return;
    deleteAllLocalData();
    router.push("/");
  };

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <YouScreenHeader title="Data & Privacy" />

        <p className="text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
          Your Inner Pause belongs to you. Here&apos;s what we remember, what it&apos;s used for, and how to remove it.
        </p>

        <section className="space-y-2">
          <SettingsSectionTitle>What Pause remembers</SettingsSectionTitle>
          <ul className="space-y-1.5 rounded-[var(--ds-radius-md)] px-4 py-3.5 text-[0.85rem]" style={{ background: "var(--ds-surface)", color: "var(--ds-text-secondary)" }}>
            <li>{summary?.journalEntryCount ?? 0} Journal entries</li>
            <li>{summary?.momentCount ?? 0} Moments</li>
            <li>{summary?.patternCount ?? 0} Patterns</li>
            <li>{summary?.practiceSessionCount ?? 0} Practice sessions</li>
            <li>{summary?.pauseCount ?? 0} Pauses taken</li>
          </ul>
        </section>

        <section className="space-y-2">
          <SettingsSectionTitle>Deeper analysis</SettingsSectionTitle>
          <div className="rounded-[var(--ds-radius-md)] px-4 py-3.5" style={{ background: "var(--ds-surface)" }}>
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9rem] font-medium">Use my entries for deeper pattern analysis</span>
                <span className="block text-[0.76rem]" style={{ color: "var(--ds-text-secondary)" }}>
                  Turning this off only stops new Patterns from being generated — nothing already found is deleted.
                </span>
              </span>
              <ToggleSwitch
                checked={consent}
                onChange={(value) => {
                  setPatternAnalysisConsent(value);
                  setConsent(value);
                }}
                label="Use my entries for deeper pattern analysis"
              />
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <SettingsSectionTitle>Export</SettingsSectionTitle>
          <button
            type="button"
            onClick={() => exportAllDataAsFile()}
            className="ds-tap flex w-full items-center justify-between rounded-[var(--ds-radius-md)] px-4 py-3.5 text-left text-[0.9rem] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ background: "var(--ds-surface)" }}
          >
            Export my data
          </button>
        </section>

        {recentEntries.length > 0 ? (
          <section className="space-y-2">
            <SettingsSectionTitle>Recent entries</SettingsSectionTitle>
            <div className="space-y-1 rounded-[var(--ds-radius-md)] px-4 py-1" style={{ background: "var(--ds-surface)" }}>
              {recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1 truncate text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
                    {entry.text || "(empty entry)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="ds-tap shrink-0 text-xs font-medium"
                    style={{ color: "var(--ds-error)" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <p className="px-1 text-[0.72rem]" style={{ color: "var(--ds-text-muted)" }}>
              Every entry can be deleted from Journey → Journal too.
            </p>
          </section>
        ) : null}

        <section className="space-y-2">
          <SettingsSectionTitle>Delete</SettingsSectionTitle>
          <div className="space-y-2.5 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
            <button
              type="button"
              onClick={handleDeleteJourneyData}
              className="ds-tap text-[0.88rem] font-semibold"
              style={{ color: "var(--ds-error)" }}
            >
              Delete all Journey data
            </button>
            <p className="text-[0.76rem]" style={{ color: "var(--ds-text-secondary)" }}>
              Removes every Journal entry, Moment, and Pattern. Practice history isn&apos;t affected.
            </p>
            <div className="h-px" style={{ background: "var(--ds-border)" }} />
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="ds-tap text-[0.88rem] font-semibold"
              style={{ color: "var(--ds-error)" }}
            >
              Delete account
            </button>
            <p className="text-[0.76rem]" style={{ color: "var(--ds-text-secondary)" }}>
              Removes everything Inner Pause has stored on this device, including Practice history and your Pass.
            </p>
          </div>
        </section>
      </div>
    </PauseShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PauseShell } from "@/components/pause-shell";
import { SettingsSectionTitle, YouScreenHeader } from "@/components/settings-row";
import { ToggleSwitch } from "@/components/toggle-switch";
import { haptic } from "@/lib/haptics";
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
import { getAccount } from "@/lib/account-store";
import { deleteServerAccount } from "@/lib/auth-client";
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

  // Destructive actions confirm in place (two steps, in the app's own
  // design), never through the browser's grey confirm() dialog.
  const [confirming, setConfirming] = useState<"journey" | "account" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteJourneyData = () => {
    haptic("success");
    deleteJourneyData();
    setConfirming(null);
    refresh();
  };

  const handleDeleteAccount = () => {
    const signedIn = Boolean(getAccount());
    setDeleting(true);
    setDeleteError("");
    void (async () => {
      // The account on the server goes first: if that can't happen (offline,
      // say), nothing is deleted and nothing pretends it was.
      if (signedIn) {
        try {
          await deleteServerAccount();
        } catch (error) {
          setDeleting(false);
          setDeleteError(`Your account couldn't be deleted right now. ${error instanceof Error ? error.message : ""} Please try again when you're online.`);
          return;
        }
      }
      await deleteAllLocalData();
      haptic("success");
      router.push("/");
    })();
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
            <li>{count(summary?.journalEntryCount, "journal entry", "journal entries")}</li>
            <li>{count(summary?.momentCount, "Moment", "Moments")}</li>
            <li>{count(summary?.patternCount, "Pattern", "Patterns")}</li>
            <li>{count(summary?.practiceSessionCount, "Practice day", "Practice days")}</li>
            <li>{count(summary?.pauseCount, "Pause taken", "Pauses taken")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <SettingsSectionTitle>Deeper analysis</SettingsSectionTitle>
          <div className="rounded-[var(--ds-radius-md)] px-4 py-3.5" style={{ background: "var(--ds-surface)" }}>
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9rem] font-medium">Use my entries for deeper pattern analysis</span>
                <span className="block text-[0.76rem]" style={{ color: "var(--ds-text-secondary)" }}>
                  Turning this off only stops new Patterns. Nothing already found is deleted.
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
            <p className="px-1 text-[0.75rem]" style={{ color: "var(--ds-text-muted)" }}>
              You can also delete any entry from your story in Journey.
            </p>
          </section>
        ) : null}

        <section className="space-y-2">
          <SettingsSectionTitle>Delete</SettingsSectionTitle>
          <div className="space-y-2.5 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
            <button
              type="button"
              onClick={() => setConfirming(confirming === "journey" ? null : "journey")}
              aria-expanded={confirming === "journey"}
              className="ds-tap -my-2.5 flex min-h-11 items-center text-[0.88rem] font-semibold"
              style={{ color: "var(--ds-error)" }}
            >
              Delete all Journey data
            </button>
            {confirming === "journey" ? (
              <ConfirmRow
                question="Delete every journal entry, Moment and Pattern? This can't be undone."
                action="Delete Journey data"
                onKeep={() => setConfirming(null)}
                onConfirm={handleDeleteJourneyData}
              />
            ) : null}
            <p className="text-[0.76rem]" style={{ color: "var(--ds-text-secondary)" }}>
              Removes every Journal entry, Moment, and Pattern. Practice history isn&apos;t affected.
            </p>
            <div className="h-px" style={{ background: "var(--ds-border)" }} />
            <button
              type="button"
              onClick={() => setConfirming(confirming === "account" ? null : "account")}
              aria-expanded={confirming === "account"}
              className="ds-tap -my-2.5 flex min-h-11 items-center text-[0.88rem] font-semibold"
              style={{ color: "var(--ds-error)" }}
            >
              Delete account
            </button>
            {confirming === "account" ? (
              <ConfirmRow
                question={
                  getAccount()
                    ? "Delete your account, any active Pass, and everything on this device? This can't be undone."
                    : "Delete everything Inner Pause has stored on this device? This can't be undone."
                }
                action={deleting ? "Deleting" : "Delete everything"}
                disabled={deleting}
                onKeep={() => setConfirming(null)}
                onConfirm={handleDeleteAccount}
              />
            ) : null}
            {deleteError ? (
              <p role="alert" className="text-[0.8rem]" style={{ color: "var(--ds-error)" }}>
                {deleteError}
              </p>
            ) : null}
            <p className="text-[0.76rem]" style={{ color: "var(--ds-text-secondary)" }}>
              Removes everything Inner Pause has stored on this device, including Practice history and your Pass.
            </p>
          </div>
        </section>
      </div>
    </PauseShell>
  );
}

function count(value: number | undefined, one: string, many: string) {
  const n = value ?? 0;
  return `${n} ${n === 1 ? one : many}`;
}

function ConfirmRow({
  question,
  action,
  disabled = false,
  onKeep,
  onConfirm,
}: {
  question: string;
  action: string;
  disabled?: boolean;
  onKeep: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="ds-settle space-y-3 rounded-[var(--ds-radius-sm)] px-3.5 py-3" style={{ background: "color-mix(in srgb, var(--ds-error) 8%, var(--ds-surface))" }}>
      <p className="text-[0.85rem] leading-5">{question}</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onKeep} className="ds-tap min-h-11 rounded-full px-4 text-sm font-medium" style={{ color: "var(--ds-text-secondary)" }}>
          Keep it
        </button>
        <button type="button" onClick={onConfirm} disabled={disabled} className="ds-tap min-h-11 rounded-full px-4 text-sm font-semibold" style={{ background: "var(--ds-error)", color: "#fff" }}>
          {action}
        </button>
      </div>
    </div>
  );
}

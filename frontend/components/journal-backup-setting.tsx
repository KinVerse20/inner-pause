"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SettingsSectionTitle } from "@/components/settings-row";
import { ToggleSwitch } from "@/components/toggle-switch";
import { getAccount } from "@/lib/account-store";
import { haptic } from "@/lib/haptics";
import { disableJournalBackup, enableJournalBackup, isJournalBackupOn, journalBackupAvailable } from "@/lib/journal-sync";

// You → Data & Privacy → Journal backup (lib/journal-sync.ts). Off by
// default, explained plainly: what's kept, where, and what turning it off
// does. Needs an account, and the server set up for it.
export function JournalBackupSetting() {
  const [on, setOn] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Device state, read after mount (same reasoning as you-preferences-screen.tsx).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(isJournalBackupOn());
    setSignedIn(Boolean(getAccount()));
    let live = true;
    void journalBackupAvailable().then((value) => live && setAvailable(value));
    return () => {
      live = false;
    };
  }, []);

  const toggle = async (next: boolean) => {
    if (busy) return;
    haptic("tap");
    setBusy(true);
    setMessage("");
    const result = next ? await enableJournalBackup() : await disableJournalBackup();
    setOn(isJournalBackupOn());
    setMessage(result.message);
    setBusy(false);
  };

  const description = !signedIn
    ? "Sign in to keep a private copy of your journal you can bring back on a new device."
    : available === false
      ? "Journal backup isn't available yet."
      : "A private, encrypted copy in your account, so a new device can bring your journal back. Turning this off removes that copy. Entries on this device stay.";

  return (
    <section className="space-y-2">
      <SettingsSectionTitle>Journal backup</SettingsSectionTitle>
      <div className="rounded-[var(--ds-radius-md)] px-4 py-3.5" style={{ background: "var(--ds-surface)" }}>
        <div className="flex items-center gap-3">
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9rem] font-medium">Back up my journal to my account</span>
            <span className="block text-[0.76rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
              {description}
            </span>
          </span>
          {signedIn ? (
            <ToggleSwitch checked={on} onChange={(value) => void toggle(value)} disabled={busy || !available} label="Back up my journal to my account" />
          ) : (
            <Link href="/auth?mode=login&redirectTo=/profile/privacy" className="ds-tap inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold" style={{ color: "var(--ds-accent)" }}>
              Sign in
            </Link>
          )}
        </div>
        {message ? (
          <p role="status" className="mt-2 text-[0.8rem]" style={{ color: "var(--ds-text-secondary)" }}>
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

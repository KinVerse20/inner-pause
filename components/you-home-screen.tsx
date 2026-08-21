"use client";

import { useEffect, useState } from "react";

import {
  IconBell,
  IconCalendar,
  IconInfo,
  IconPerson,
  IconShield,
  IconSliders,
  IconTicket,
} from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { SettingsRow } from "@/components/settings-row";
import { getAccount, subscribeAccount, type LocalAccount } from "@/lib/account-store";
import { getPassState, subscribeEntitlements, type PassState } from "@/lib/entitlements";

// You (docs/PRODUCT_FLOW.md §27): the control/trust area, not a content
// feed. Locked structure for this slice: Account -> Inner Pause Pass ->
// Preferences -> Notifications -> Calendar -> Data & Privacy -> Help/About
// — Offline lives inside Preferences, never as its own top-level row.
export function YouHomeScreen() {
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [passState, setPassState] = useState<PassState>("free");

  useEffect(() => {
    const refresh = () => {
      setAccount(getAccount());
      setPassState(getPassState());
    };
    refresh();
    const unsubAccount = subscribeAccount(refresh);
    const unsubPass = subscribeEntitlements(refresh);
    return () => {
      unsubAccount();
      unsubPass();
    };
  }, []);

  const passStatusLabel = passState === "active" ? "Active" : passState === "expired" ? "Expired" : "Free";

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <header>
          <h1 className="text-[1.4rem] font-semibold leading-tight tracking-[-0.01em]">You</h1>
          <p className="mt-1 text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
            Your account, preferences, and what Inner Pause remembers.
          </p>
        </header>

        <section aria-label="You" className="space-y-2.5">
          <SettingsRow
            href="/profile/account"
            label="Account"
            description="Profile · Sign in"
            status={account ? account.displayName : "Not signed in"}
            Icon={IconPerson}
          />
          <SettingsRow
            href="/profile/pass"
            label="Inner Pause Pass"
            description="Deeper Journey intelligence"
            status={passStatusLabel}
            Icon={IconTicket}
          />
          <SettingsRow
            href="/profile/preferences"
            label="Preferences"
            description="Theme · Sound · Practice · Offline"
            Icon={IconSliders}
          />
          <SettingsRow href="/profile/notifications" label="Notifications" description="What Pause can bring you" Icon={IconBell} />
          <SettingsRow href="/profile/calendar" label="Calendar" description="Google Calendar connection" Icon={IconCalendar} />
          <SettingsRow href="/profile/privacy" label="Data & Privacy" description="What Pause remembers, export, delete" Icon={IconShield} />
          <SettingsRow href="/profile/help" label="Help / About" description="Why Inner Pause · Sound & Traditions" Icon={IconInfo} />
        </section>
      </div>
    </PauseShell>
  );
}

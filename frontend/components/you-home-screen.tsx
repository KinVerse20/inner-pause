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
import { Stagger, StaggerItem } from "@/components/reveal";
import { SettingsRow } from "@/components/settings-row";
import { getAccount, subscribeAccount, type LocalAccount } from "@/lib/account-store";
import { getPassState, subscribeEntitlements, type PassState } from "@/lib/entitlements";

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
  const displayName = account?.displayName?.trim() || "there";
  const initial = (account?.displayName?.trim().charAt(0) || "Y").toUpperCase();

  return (
    <PauseShell>
      <Stagger className="space-y-6 pb-4 pt-2">
        <StaggerItem>
        <header className="flex flex-col items-center pt-4 text-center">
          <span
            className="grid h-20 w-20 place-items-center rounded-full text-2xl font-semibold"
            style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
          >
            {initial}
          </span>
          <h1 className="ds-display mt-4 text-[1.85rem]">You</h1>
          <p className="mt-1 text-[1.05rem] font-medium">Good to see you{account ? `, ${displayName.split(" ")[0]}` : ""}</p>
          <p className="mt-1 text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
            Here&rsquo;s to a calmer, brighter you.
          </p>
        </header>
        </StaggerItem>

        <StaggerItem>
        <section aria-label="You" className="ds-card divide-y overflow-hidden" style={{ borderColor: "var(--ds-border)" }}>
          <SettingsRow
            href="/profile/account"
            label="Account"
            description="Profile · Sign in"
            status={account ? account.displayName : "Not signed in"}
            Icon={IconPerson}
            flush
          />
          <SettingsRow
            href="/profile/pass"
            label="Inner Pause Pass"
            description="Deeper Journey intelligence"
            status={passStatusLabel}
            Icon={IconTicket}
            flush
          />
          <SettingsRow
            href="/profile/preferences"
            label="Preferences"
            description="Theme · Sound · Practice · Offline"
            Icon={IconSliders}
            flush
          />
          <SettingsRow href="/profile/notifications" label="Notifications" description="What Pause can bring you" Icon={IconBell} flush />
          <SettingsRow href="/profile/calendar" label="Calendar" description="Google Calendar connection" Icon={IconCalendar} flush />
          <SettingsRow href="/profile/privacy" label="Data & Privacy" description="What Pause remembers, export, delete" Icon={IconShield} flush />
          <SettingsRow href="/profile/help" label="Help / About" description="Why Inner Pause · Sound & Traditions" Icon={IconInfo} flush />
        </section>
        </StaggerItem>
      </Stagger>
    </PauseShell>
  );
}

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
import { listPauseRecords, subscribePauseRecords } from "@/lib/pause-storage";

function readStats() {
  const completed = listPauseRecords().filter((record) => record.completedAt);
  return {
    pauses: completed.length,
    minutes: Math.round(completed.reduce((sum, record) => sum + record.durationSeconds, 0) / 60),
    checkins: completed.filter((record) => record.feedback).length,
  };
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-1">
      <dt className="sr-only">{label}</dt>
      <dd className="ds-num text-[1.35rem] leading-tight">{value}</dd>
      <dd className="ds-caption">{label}</dd>
    </div>
  );
}

export function YouHomeScreen() {
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [passState, setPassState] = useState<PassState>("free");
  const [stats, setStats] = useState({ pauses: 0, minutes: 0, checkins: 0 });

  useEffect(() => {
    const refresh = () => {
      setAccount(getAccount());
      setPassState(getPassState());
      setStats(readStats());
    };
    refresh();
    const unsubAccount = subscribeAccount(refresh);
    const unsubPass = subscribeEntitlements(refresh);
    const unsubPauses = subscribePauseRecords(refresh);
    return () => {
      unsubAccount();
      unsubPass();
      unsubPauses();
    };
  }, []);

  const passStatusLabel = passState === "active" ? "Active" : passState === "expired" ? "Expired" : "Free";
  const displayName = account?.displayName?.trim() || "there";
  const initial = (account?.displayName?.trim().charAt(0) || "Y").toUpperCase();

  return (
    <PauseShell>
      <Stagger className="space-y-6 pb-4 pt-2">
        <StaggerItem>
          <header>
            <h1 className="ds-display text-[1.85rem]">You</h1>
          </header>
        </StaggerItem>

        <StaggerItem>
          <section aria-label="Your profile" className="ds-card ds-wash px-4 py-4">
            <div className="flex items-center gap-3.5">
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-semibold"
                style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
                aria-hidden="true"
              >
                {initial}
              </span>
              <div className="min-w-0">
                <p className="ds-h3 truncate">{account ? displayName : "Your space"}</p>
                <p className="text-[0.85rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                  {account ? account.email : "Sign in to keep your Journey safe across devices."}
                </p>
              </div>
            </div>
            {/* Kinverse feature: Pauses · minutes · reflections at a glance. */}
            <dl className="mt-4 grid grid-cols-3 divide-x rounded-[var(--ds-radius-md)] py-3 text-center" style={{ background: "var(--ds-bg)" }}>
              <Stat value={stats.pauses} label={stats.pauses === 1 ? "Pause" : "Pauses"} />
              <Stat value={stats.minutes} label="minutes" />
              <Stat value={stats.checkins} label={stats.checkins === 1 ? "check-in" : "check-ins"} />
            </dl>
          </section>
        </StaggerItem>

        <StaggerItem>
        <section aria-label="Settings" className="ds-card divide-y overflow-hidden">
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

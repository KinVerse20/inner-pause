"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";


import { LandscapeScene } from "@/components/landscape-scene";
import {
  IconBell,
  IconCalendar,
  IconChevronRight,
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
import { subscribeEntitlements } from "@/lib/entitlements";
import { getPassSummary, type PassSummary } from "@/lib/pass-summary";
import { haptic } from "@/lib/haptics";
import { listenedSeconds } from "@/lib/listening";
import { listPauseRecords, subscribePauseRecords } from "@/lib/pause-storage";

const GOLD = "#E0A868";

function readStats() {
  const completed = listPauseRecords().filter((record) => record.completedAt);
  return {
    pauses: completed.length,
    minutes: Math.round(completed.reduce((sum, record) => sum + listenedSeconds(record), 0) / 60),
    checkins: completed.filter((record) => record.feedback).length,
  };
}

// Settings, behind the gear on the You tab: your account and what you've
// given yourself, the Pass, and every setting.
export function YouHomeScreen() {
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [pass, setPass] = useState<PassSummary | null>(null);
  const [stats, setStats] = useState({ pauses: 0, minutes: 0, checkins: 0 });

  useEffect(() => {
    const refresh = () => {
      setAccount(getAccount());
      setPass(getPassSummary());
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

  const displayName = account?.displayName?.trim() || "there";
  const initial = (account?.displayName?.trim().charAt(0) || "Y").toUpperCase();

  return (
    <PauseShell>
      <Stagger className="space-y-6 pb-4 pt-2">
        <StaggerItem>
          <Link href="/journey" onClick={() => haptic("tap")} className="ds-tap -my-3.5 inline-flex min-h-11 items-center gap-1 pr-2 text-xs font-medium" style={{ color: "var(--ds-text-secondary)" }}>
            <IconChevronRight className="h-3.5 w-3.5" style={{ transform: "scaleX(-1)" }} />
            You
          </Link>
          <h1 className="ds-display mt-2 text-[1.5rem]">Settings</h1>
        </StaggerItem>

        <StaggerItem>
          <section aria-label="Your profile" className="overflow-hidden rounded-[var(--ds-radius-lg)]" style={{ background: "var(--ds-surface)", boxShadow: "var(--ds-elevation-1)" }}>
            <span className="relative block h-24 overflow-hidden" aria-hidden="true">
              <LandscapeScene variant="dusk" className="absolute inset-0 h-full w-full scale-[1.1]" />
            </span>
            <div className="-mt-9 px-5 pb-5">
              <span
                className="relative grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full text-[1.6rem] font-semibold"
                style={{
                  background: "var(--ds-surface)",
                  color: "var(--ds-accent)",
                  boxShadow: "0 0 0 4px var(--ds-surface), 0 0 0 6px color-mix(in srgb, var(--ds-accent-secondary) 45%, transparent), var(--ds-elevation-1)",
                }}
                aria-hidden="true"
              >
                {initial}
              </span>
              <p className="ds-display mt-3 truncate text-[1.6rem]">{account ? displayName : "Your space"}</p>
              <p className="mt-0.5 text-[0.88rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                {account ? account.email : "Sign in to keep your Journey safe across devices."}
              </p>
              {!account ? (
                <Link href="/auth?mode=login" onClick={() => haptic("tap")} className="ds-tonal mt-3 inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold">
                  Sign in
                </Link>
              ) : null}
            </div>
          </section>
        </StaggerItem>

        {/* Kinverse feature: Pauses · minutes · check-ins at a glance. */}
        <StaggerItem>
          <dl className="grid grid-cols-3 gap-2.5">
            <StatTile value={stats.pauses} label={stats.pauses === 1 ? "Pause" : "Pauses"} tone="var(--ds-outcome-calm)" icon={<path d="M9 7v10M15 7v10" />} />
            <StatTile value={stats.minutes} label="minutes" tone="var(--ds-outcome-focus)" icon={<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2" /></>} />
            <StatTile value={stats.checkins} label={stats.checkins === 1 ? "check-in" : "check-ins"} tone="var(--ds-outcome-reset)" icon={<path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z" />} />
          </dl>
        </StaggerItem>

        <StaggerItem>
          <Link
            href="/profile/pass"
            onClick={() => haptic("tap")}
            className="ds-tap ds-card-lift flex items-center gap-3.5 rounded-[var(--ds-radius-lg)] px-5 py-4"
            style={{ background: `linear-gradient(120deg, color-mix(in srgb, ${GOLD} 22%, var(--ds-surface)), var(--ds-surface))`, boxShadow: "var(--ds-elevation-1)" }}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${GOLD} 30%, var(--ds-surface))`, color: `color-mix(in srgb, ${GOLD} 80%, var(--ds-text))` }} aria-hidden="true">
              <IconTicket className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.98rem] font-semibold">Inner Pause Pass</span>
              <span className="block text-[0.82rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                {pass?.line ?? ""}
              </span>
            </span>
            <span className="ds-label shrink-0 rounded-full px-2.5 py-1 uppercase" style={{ background: `color-mix(in srgb, ${GOLD} 22%, var(--ds-surface))`, color: `color-mix(in srgb, ${GOLD} 45%, var(--ds-text))` }}>
              {pass?.label ?? ""}
            </span>
          </Link>
        </StaggerItem>

        <StaggerItem>
          <section aria-label="Settings" className="ds-card divide-y overflow-hidden">
            <SettingsRow href="/profile/account" label="Account" description="Profile · Sign in" status={account ? account.displayName : "Not signed in"} Icon={IconPerson} tone="var(--ds-accent)" flush />
            <SettingsRow href="/profile/preferences" label="Preferences" description="Theme · Sound · Practice · Offline" Icon={IconSliders} tone="var(--ds-outcome-focus)" flush />
            <SettingsRow href="/profile/notifications" label="Notifications" description="What Pause can bring you" Icon={IconBell} tone="var(--ds-outcome-confidence)" flush />
            <SettingsRow href="/profile/calendar" label="Calendar" description="Google Calendar connection" Icon={IconCalendar} tone="var(--ds-outcome-calm)" flush />
            <SettingsRow href="/profile/privacy" label="Data & Privacy" description="What Pause remembers, export, delete" Icon={IconShield} tone="var(--ds-outcome-reset)" flush />
            <SettingsRow href="/profile/help" label="Help / About" description="Why Inner Pause · Sound & Traditions" Icon={IconInfo} tone="var(--ds-accent-secondary)" flush />
          </section>
        </StaggerItem>
      </Stagger>
    </PauseShell>
  );
}

function StatTile({ value, label, tone, icon }: { value: number; label: string; tone: string; icon: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-1 rounded-[var(--ds-radius-md)] px-2 py-3.5 text-center" style={{ background: `color-mix(in srgb, ${tone} 10%, var(--ds-surface))`, boxShadow: "var(--ds-elevation-1)" }}>
      <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${tone} 22%, var(--ds-surface))`, color: `color-mix(in srgb, ${tone} 85%, var(--ds-text))` }} aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </span>
      <dt className="sr-only">{label}</dt>
      <dd className="ds-num text-[1.4rem] font-semibold leading-tight">{value}</dd>
      <dd className="ds-caption">{label}</dd>
    </div>
  );
}

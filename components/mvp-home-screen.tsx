"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ChakraGlyph } from "@/components/chakra-symbol";
import { BrandLogo, GlassCard, GoldButton, MvpShell } from "@/components/mvp-shell";
import { chakras } from "@/data/chakras";
import { usePlayer } from "@/components/player-provider";
import { useMvpState } from "@/lib/use-mvp-state";
import { QuickPlayDuration } from "@/lib/types";

const quickActions: Array<{ label: string; duration: QuickPlayDuration; chakraId: "heart" | "root" | "third-eye" | "crown"; icon: string }> = [
  { label: "Breathwork", duration: 5, chakraId: "heart" as const, icon: "◌" },
  { label: "Grounding", duration: 3, chakraId: "root" as const, icon: "◇" },
  { label: "Meditation", duration: 10, chakraId: "third-eye" as const, icon: "◎" },
  { label: "Sound Bath", duration: 15, chakraId: "crown" as const, icon: "✦" },
];

export function MvpHomeScreen() {
  const router = useRouter();
  const state = useMvpState();
  const player = usePlayer();
  const latest = state.entries.find((entry) => entry.analysis);
  const recentPlan = state.entries.find((entry) => entry.plan)?.plan;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  useEffect(() => {
    if (!state.profile.onboardingCompleted) router.replace("/onboarding");
  }, [router, state.profile.onboardingCompleted]);

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <header className="flex items-center justify-between gap-3">
          <BrandLogo compact />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-stone-400" suppressHydrationWarning>{greeting}</p>
            <h1 className="truncate font-serif text-2xl text-[var(--gold-light)]">{state.profile.fullName || "Friend"}</h1>
          </div>
          <button
            type="button"
            onClick={() => router.push("/insights")}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/[0.04]"
            aria-label="Notifications and insights"
          >
            ♢
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--gold-primary)]" />
          </button>
        </header>

        <GlassCard className="relative overflow-hidden p-4">
          <div className="absolute right-[-2rem] top-[-2.5rem] h-32 w-32 rounded-full mvp-orb opacity-60" />
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold-muted)]">Today&apos;s Check-in</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem] sm:items-center">
            <div>
              <h2 className="font-serif text-3xl leading-none text-[var(--gold-light)]">How are you feeling?</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-stone-300">Journal your day and receive a personalised chakra-based reset.</p>
              <GoldButton className="mt-3 w-full sm:w-auto" onClick={() => router.push("/journal")}>
                Start Journaling
              </GoldButton>
            </div>
            <div className="mx-auto hidden h-28 w-28 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-purple-500/10 sm:grid">
              <ChakraGlyph chakraId="crown" className="h-16 w-16 text-[var(--gold-light)] drop-shadow-[0_0_28px_rgba(255,217,135,0.34)]" />
            </div>
          </div>
        </GlassCard>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-serif text-xl text-[var(--gold-light)]">Quick Reset</h2>
            <p className="text-xs text-stone-500">Uses existing local audio</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => player.startQuickPlayback({ chakraId: action.chakraId, duration: action.duration })}
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-left transition hover:bg-white/[0.08]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--gold-border-soft)] text-lg text-[var(--gold-light)]">{action.icon}</span>
                <span className="mt-2 block text-sm font-medium text-stone-100">{action.label}</span>
                <span className="mt-0.5 block text-xs text-stone-400">{action.duration} min</span>
              </button>
            ))}
          </div>
        </section>

        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold-muted)]">Latest insight</p>
          {latest?.analysis ? (
            <>
              <p className="mt-2 line-clamp-2 font-serif text-xl leading-tight text-stone-100">{latest.analysis.summary}</p>
              <p className="mt-2 line-clamp-1 text-xs text-stone-400">
                {latest.analysis.chakraAssociations.slice(0, 2).map((item) => chakras.find((chakra) => chakra.id === item.chakra)?.name).join(" and ")} may need attention.
              </p>
              <Link href="/insights" className="mt-3 inline-flex text-sm font-semibold text-[var(--gold-light)]">View Insight →</Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm leading-5 text-stone-300">Your first insight appears after one journal entry.</p>
              <Link href="/journal" className="mt-3 inline-flex text-sm font-semibold text-[var(--gold-light)]">Create first entry →</Link>
            </>
          )}
        </GlassCard>

        {recentPlan ? (
          <GlassCard className="p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold-muted)]">Current healing session</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="line-clamp-1 font-serif text-xl text-stone-100">{recentPlan.title}</p>
              <Link href={`/healing?entry=${recentPlan.journalEntryId}`} className="shrink-0 text-sm font-semibold text-[var(--gold-light)]">Resume →</Link>
            </div>
          </GlassCard>
        ) : null}

        <GlassCard className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-serif text-xl text-[var(--gold-light)]">Morning guidance</p>
              <p className="mt-1 line-clamp-1 text-xs text-stone-400">Optional WhatsApp guidance is mocked locally.</p>
            </div>
            <Link href="/guidance" className="rounded-full border border-[var(--gold-border-soft)] px-4 py-2 text-sm text-[var(--gold-light)]">Setup</Link>
          </div>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

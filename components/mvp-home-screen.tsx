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
      <div className="space-y-5">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo compact />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-stone-400" suppressHydrationWarning>{greeting}</p>
            <h1 className="truncate font-serif text-3xl text-[var(--gold-light)]">{state.profile.fullName || "Friend"}</h1>
          </div>
          <button
            type="button"
            onClick={() => router.push("/insights")}
            className="relative grid h-11 w-11 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/[0.04]"
            aria-label="Notifications and insights"
          >
            ♢
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--gold-primary)]" />
          </button>
        </header>

        <GlassCard className="relative overflow-hidden p-5">
          <div className="absolute right-[-3rem] top-[-3rem] h-44 w-44 rounded-full mvp-orb opacity-70" />
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold-muted)]">Today&apos;s Check-in</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_12rem] sm:items-center">
            <div>
              <h2 className="font-serif text-4xl leading-none text-[var(--gold-light)]">How are you feeling today?</h2>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Journal your day and receive a calm emotional insight with a personalised chakra-based reset.
              </p>
              <GoldButton className="mt-5 w-full sm:w-auto" onClick={() => router.push("/journal")}>
                Start Journaling
              </GoldButton>
            </div>
            <div className="mx-auto grid h-40 w-40 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-purple-500/10">
              <ChakraGlyph chakraId="crown" className="h-24 w-24 text-[var(--gold-light)] drop-shadow-[0_0_28px_rgba(255,217,135,0.34)]" />
            </div>
          </div>
        </GlassCard>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-[var(--gold-light)]">Quick Reset</h2>
            <p className="text-xs text-stone-500">Uses existing local audio</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => player.startQuickPlayback({ chakraId: action.chakraId, duration: action.duration })}
                className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4 text-left transition hover:bg-white/[0.08]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--gold-border-soft)] text-xl text-[var(--gold-light)]">{action.icon}</span>
                <span className="mt-4 block font-medium text-stone-100">{action.label}</span>
                <span className="mt-1 block text-sm text-stone-400">{action.duration} min</span>
              </button>
            ))}
          </div>
        </section>

        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold-muted)]">Latest insight</p>
          {latest?.analysis ? (
            <>
              <p className="mt-4 font-serif text-2xl leading-tight text-stone-100">{latest.analysis.summary}</p>
              <p className="mt-3 text-sm text-stone-400">
                {latest.analysis.chakraAssociations.slice(0, 2).map((item) => chakras.find((chakra) => chakra.id === item.chakra)?.name).join(" and ")} may need attention.
              </p>
              <Link href="/insights" className="mt-5 inline-flex text-sm font-semibold text-[var(--gold-light)]">View Insight →</Link>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-stone-300">Your first insight will appear after one journal analysis.</p>
              <Link href="/journal" className="mt-5 inline-flex text-sm font-semibold text-[var(--gold-light)]">Create first entry →</Link>
            </>
          )}
        </GlassCard>

        <div className="grid gap-3 sm:grid-cols-2">
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold-muted)]">Patterns</p>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              {state.entries.length < 3
                ? "We are still learning what supports you. Complete a few more sessions to unlock personal insights."
                : "Recent themes include stress, self-doubt and expression."}
            </p>
            <Link href="/insights" className="mt-4 inline-flex text-sm font-semibold text-[var(--gold-light)]">Explore Insight →</Link>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold-muted)]">Current healing session</p>
            {recentPlan ? (
              <>
                <p className="mt-3 font-serif text-2xl text-stone-100">{recentPlan.title}</p>
                <p className="mt-1 text-sm text-stone-400">{recentPlan.totalDurationMinutes} min • {recentPlan.status}</p>
                <Link href={`/healing?entry=${recentPlan.journalEntryId}`} className="mt-4 inline-flex text-sm font-semibold text-[var(--gold-light)]">Resume Plan →</Link>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-stone-300">No personalised plan yet. Start from Journal.</p>
            )}
          </GlassCard>
        </div>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-serif text-2xl text-[var(--gold-light)]">Morning guidance</p>
              <p className="mt-1 text-sm text-stone-400">Optional WhatsApp guidance is mocked until provider credentials are connected.</p>
            </div>
            <Link href="/guidance" className="rounded-full border border-[var(--gold-border-soft)] px-4 py-2 text-sm text-[var(--gold-light)]">Setup</Link>
          </div>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

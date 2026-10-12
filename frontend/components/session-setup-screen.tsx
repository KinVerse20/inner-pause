"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { GlassCard, GoldButton, MvpShell } from "@/components/mvp-shell";
import { usePlayer } from "@/components/player-provider";
import { chakraMap, moods } from "@/data/chakras";
import { isSessionUnlocked } from "@/lib/progress";
import { ChakraId, MoodValue } from "@/lib/types";
import { useHydrated, useProgressStore } from "@/lib/use-progress-store";

export function SessionSetupScreen({
  chakraId,
  sessionId,
}: {
  chakraId: ChakraId;
  sessionId: string;
}) {
  const router = useRouter();
  const player = usePlayer();
  const chakra = chakraMap[chakraId];
  const session = chakra?.sessions.find((item) => item.id === sessionId);
  const [mood, setMood] = useState<MoodValue>("neutral");
  const progress = useProgressStore();
  const ready = useHydrated();

  const allowed = useMemo(() => {
    if (!chakra || !session) return false;
    return isSessionUnlocked(progress, chakra, session.index);
  }, [chakra, progress, session]);

  useEffect(() => {
    if (ready && (!chakra || !session || !allowed)) {
      router.replace("/practice");
    }
  }, [allowed, chakra, ready, router, session]);

  if (!chakra || !session || !ready || !allowed) {
    return null;
  }

  return (
    <MvpShell hideNav>
      <div className="mx-auto max-w-xl space-y-3.5">
        <Link href="/practice" className="text-sm text-[var(--ip-muted)] hover:text-[var(--ip-ink)]">
          ← Back to practice
        </Link>

        <GlassCard className="p-5">
          <div
            className="mb-4 h-2 rounded-full"
            style={{ background: `linear-gradient(90deg, ${chakra.color}, ${chakra.accent})` }}
          />
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: chakra.color }}>
            {chakra.frequencyLabel} · {chakra.name.replace(" Chakra", "")}
          </p>
          <h1 className="mt-2 font-serif text-2xl text-[var(--ip-ink)]">{session.name}</h1>
          <p className="mt-2 text-sm leading-5 text-[var(--ip-body)]">{session.instructions}</p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--ip-border)] bg-white/70 p-3">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--ip-muted)]">Duration</p>
              <p className="mt-1.5 font-medium text-[var(--ip-ink)]">{session.durationMinutes} minutes</p>
            </div>
            <div className="rounded-2xl border border-[var(--ip-border)] bg-white/70 p-3">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--ip-muted)]">Purpose</p>
              <p className="mt-1.5 text-sm text-[var(--ip-body)]">{chakra.purpose}</p>
            </div>
            <div className="rounded-2xl border border-[var(--ip-border)] bg-white/70 p-3">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--ip-muted)]">Mission</p>
              <p className="mt-1.5 text-sm text-[var(--ip-body)]">{session.mission}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-serif text-xl text-[var(--ip-ink)]">How are you feeling right now?</h2>
          <div className="mt-3 grid gap-2">
            {moods.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMood(option.value)}
                className={`min-h-12 rounded-2xl border px-4 text-left transition ${
                  mood === option.value
                    ? "border-purple-300 bg-purple-100 text-[var(--ip-purple)]"
                    : "border-[var(--ip-border)] bg-white/70 text-[var(--ip-ink)] hover:bg-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <GoldButton
            className="mt-4 w-full"
            onClick={() =>
              player.startJourneyPlayback({
                chakraId: chakra.id,
                sessionId: session.id,
                title: session.name,
                subtitle: chakra.purpose,
                durationMinutes: session.durationMinutes,
                route: `/session/${chakra.id}/${session.id}/player?before=${mood}`,
              })
            }
          >
            Start Session
          </GoldButton>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

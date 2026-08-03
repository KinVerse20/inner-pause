"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
      router.replace("/journey");
    }
  }, [allowed, chakra, ready, router, session]);

  if (!chakra || !session || !ready || !allowed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-8 pt-6 sm:px-6">
        <Link href="/journey" className="text-sm text-slate-300 hover:text-slate-50">
          ← Back to journey
        </Link>
        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/6 p-6">
          <div
            className="mb-5 h-2 rounded-full"
            style={{ background: `linear-gradient(90deg, ${chakra.color}, ${chakra.accent})` }}
          />
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{chakra.name}</p>
          <h1 className="mt-3 text-3xl font-semibold">{session.name}</h1>
          <p className="mt-3 text-slate-300">{session.instructions}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Duration</p>
              <p className="mt-2 text-lg font-medium">{session.durationMinutes} minutes</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Purpose</p>
              <p className="mt-2 text-sm text-slate-200">{chakra.purpose}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mission</p>
              <p className="mt-2 text-sm text-slate-200">{session.mission}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/6 p-6">
          <h2 className="text-xl font-semibold">How are you feeling right now?</h2>
          <div className="mt-4 grid gap-3">
            {moods.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMood(option.value)}
                className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                  mood === option.value
                    ? "border-amber-200/25 bg-amber-200/10 text-amber-50"
                    : "border-white/10 bg-slate-950/45 text-slate-200 hover:bg-white/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
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
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-300 to-orange-200 px-5 py-3 text-sm font-medium text-slate-950 transition hover:opacity-90"
          >
            Start Session
          </button>
        </section>
      </main>
    </div>
  );
}

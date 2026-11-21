"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { chakraMap, moods } from "@/data/chakras";
import { completeSession, getMoodShift, getSessionPoints, isSessionUnlocked } from "@/lib/progress";
import { writeProgress } from "@/lib/storage";
import { ChakraId, MoodValue } from "@/lib/types";
import { useHydrated, useProgressStore } from "@/lib/use-progress-store";

export function SessionCompletionScreen({
  chakraId,
  sessionId,
}: {
  chakraId: ChakraId;
  sessionId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chakra = chakraMap[chakraId];
  const session = chakra?.sessions.find((item) => item.id === sessionId);
  const moodBefore = (searchParams.get("before") as MoodValue | null) ?? "neutral";
  const progress = useProgressStore();
  const hydrated = useHydrated();
  const [moodAfter, setMoodAfter] = useState<MoodValue>("good");
  const [saved, setSaved] = useState(false);
  const [savedProgress, setSavedProgress] = useState(progress);

  const activeProgress = saved ? savedProgress : progress;

  const allowed = useMemo(() => {
    if (!chakra || !session) return false;
    return isSessionUnlocked(progress, chakra, session.index);
  }, [chakra, progress, session]);

  useEffect(() => {
    if (hydrated && (!chakra || !session || !allowed)) {
      router.replace("/journey");
    }
  }, [allowed, chakra, hydrated, router, session]);

  if (!chakra || !session || !hydrated || !allowed) return null;

  const finishSession = () => {
    const result = completeSession({
      progress,
      chakra,
      session,
      moodBefore,
      moodAfter,
    });

    writeProgress(result.next);
    setSavedProgress(result.next);
    setSaved(true);
  };

  const moodShift = getMoodShift(moodBefore, moodAfter);
  const basePoints = getSessionPoints(session.durationMinutes);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-8 sm:px-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{chakra.name}</p>
          <h1 className="mt-3 text-3xl font-semibold">Your practice is complete.</h1>
          <p className="mt-3 text-slate-300">
            You earned {basePoints + 5} energy points.
          </p>

          {!saved ? (
            <>
              <h2 className="mt-6 text-xl font-semibold">How do you feel now?</h2>
              <div className="mt-4 grid gap-3">
                {moods.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMoodAfter(option.value)}
                    className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                      moodAfter === option.value
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
                onClick={finishSession}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-300 to-orange-200 px-5 py-3 text-sm font-medium text-slate-950"
              >
                Save Progress
              </button>
            </>
          ) : (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mood change</p>
                  <p className="mt-2 text-lg font-medium">
                    {moodShift > 0 ? `Improved by ${moodShift} step${moodShift > 1 ? "s" : ""}` : moodShift < 0 ? `Lower by ${Math.abs(moodShift)} step${Math.abs(moodShift) > 1 ? "s" : ""}` : "Steady"}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated totals</p>
                  <p className="mt-2 text-sm text-slate-200">
                    {activeProgress.totalMinutes} meditation minutes • {activeProgress.energyPoints} energy points
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm text-slate-300">
                {activeProgress.badges.includes(chakra.badge)
                  ? `Badge earned: ${chakra.badge}.`
                  : "Your next session is now available if this chakra is still in progress."}
              </p>
              <button
                type="button"
                onClick={() => router.replace("/progress")}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white/90 px-5 py-3 text-sm font-medium text-slate-950"
              >
                View Rewards and Progress
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

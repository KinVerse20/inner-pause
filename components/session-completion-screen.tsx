"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { GlassCard, GoldButton, MvpShell } from "@/components/mvp-shell";
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
      router.replace("/practice");
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
    <MvpShell hideNav>
      <div className="mx-auto max-w-xl">
        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: chakra.color }}>
            {chakra.frequencyLabel} · {chakra.name.replace(" Chakra", "")}
          </p>
          <h1 className="mt-2 font-serif text-2xl text-[var(--ip-ink)]">Your practice is complete.</h1>
          <p className="mt-2 text-sm text-[var(--ip-body)]">You earned {basePoints + 5} energy points.</p>

          {!saved ? (
            <>
              <h2 className="mt-5 font-serif text-xl text-[var(--ip-ink)]">How do you feel now?</h2>
              <div className="mt-3 grid gap-2">
                {moods.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMoodAfter(option.value)}
                    className={`min-h-12 rounded-2xl border px-4 text-left transition ${
                      moodAfter === option.value
                        ? "border-purple-300 bg-purple-100 text-[var(--ip-purple)]"
                        : "border-[var(--ip-border)] bg-white/70 text-[var(--ip-ink)] hover:bg-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <GoldButton className="mt-4 w-full" onClick={finishSession}>
                Save Progress
              </GoldButton>
            </>
          ) : (
            <>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--ip-border)] bg-white/70 p-3">
                  <p className="text-xs uppercase tracking-[0.15em] text-[var(--ip-muted)]">Mood change</p>
                  <p className="mt-1.5 font-medium text-[var(--ip-ink)]">
                    {moodShift > 0 ? `Improved by ${moodShift} step${moodShift > 1 ? "s" : ""}` : moodShift < 0 ? `Lower by ${Math.abs(moodShift)} step${Math.abs(moodShift) > 1 ? "s" : ""}` : "Steady"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--ip-border)] bg-white/70 p-3">
                  <p className="text-xs uppercase tracking-[0.15em] text-[var(--ip-muted)]">Updated totals</p>
                  <p className="mt-1.5 text-sm text-[var(--ip-body)]">
                    {activeProgress.totalMinutes} meditation minutes • {activeProgress.energyPoints} energy points
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[var(--ip-body)]">
                {activeProgress.badges.includes(chakra.badge)
                  ? `Badge earned: ${chakra.badge}.`
                  : "Your next session is now available if this chakra is still in progress."}
              </p>
              <GoldButton className="mt-4 w-full" onClick={() => router.replace("/history")}>
                View Rewards and Progress
              </GoldButton>
            </>
          )}
        </GlassCard>
      </div>
    </MvpShell>
  );
}

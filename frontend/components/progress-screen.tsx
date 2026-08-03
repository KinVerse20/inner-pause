"use client";

import { useMemo, useState } from "react";

import { chakras } from "@/data/chakras";
import {
  defaultProgress,
  getCompletedChakraCount,
  getDisplayStreak,
  getMoodShift,
  getStreakMessage,
} from "@/lib/progress";
import { resetProgress, writeProgress } from "@/lib/storage";
import { useProgressStore } from "@/lib/use-progress-store";

export function ProgressScreen() {
  const progress = useProgressStore();
  const [, forceUpdate] = useState(0);

  const moodSummary = useMemo(() => {
    if (progress.history.length === 0) return null;
    const totalShift = progress.history.reduce(
      (sum, item) => sum + getMoodShift(item.moodBefore, item.moodAfter),
      0,
    );
    const average = totalShift / progress.history.length;
    if (average > 0.4) return "Your recent sessions tend to end on a lighter note.";
    if (average < -0.4) return "Recent sessions have felt heavier. Consider shorter sessions for a while.";
    return "Your moods have been fairly steady across recent sessions.";
  }, [progress.history]);

  const handleReset = () => {
    const confirmed = window.confirm("Reset all local progress for this device?");
    if (!confirmed) return;
    resetProgress();
    writeProgress(defaultProgress);
    forceUpdate((value) => value + 1);
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total sessions completed", value: progress.completedSessionKeys.length },
          { label: "Total meditation minutes", value: progress.totalMinutes },
          { label: "Current streak", value: getDisplayStreak(progress) },
          { label: "Longest streak", value: progress.longestStreak },
          { label: "Energy points", value: progress.energyPoints },
          { label: "Completed chakra journeys", value: getCompletedChakraCount(progress) },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      {getStreakMessage(progress) ? (
        <section className="rounded-[1.5rem] border border-amber-200/15 bg-amber-200/10 p-4 text-sm text-amber-50">
          {getStreakMessage(progress)}
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-5">
        <h2 className="text-xl font-semibold">Chakra badges</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {chakras.map((chakra) => {
            const earned = progress.badges.includes(chakra.badge);
            return (
              <div
                key={chakra.id}
                className={`rounded-full border px-4 py-2 text-sm ${
                  earned
                    ? "border-amber-200/20 bg-amber-200/10 text-amber-50"
                    : "border-white/10 bg-slate-950/40 text-slate-400"
                }`}
              >
                {chakra.badge}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-5">
        <h2 className="text-xl font-semibold">Mood improvement summary</h2>
        <p className="mt-3 text-sm text-slate-300">{moodSummary ?? "Complete a few sessions to see a summary here."}</p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-5">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-red-300/20 bg-red-500/10 px-5 py-3 text-sm text-red-100 transition hover:bg-red-500/15"
        >
          Reset Progress
        </button>
      </section>
    </div>
  );
}

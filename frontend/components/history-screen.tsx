"use client";

import { useMemo } from "react";

import { useAppPreferences } from "@/lib/use-app-preferences";
import { useProgressStore } from "@/lib/use-progress-store";

export function HistoryScreen() {
  const progress = useProgressStore();
  const preferences = useAppPreferences();
  const items = useMemo(
    () =>
      [
        ...progress.history.map((entry) => ({
          id: `${entry.sessionKey}-${entry.completedAt}`,
          type: "journey" as const,
          title: entry.sessionName,
          subtitle: entry.chakraName,
          completedAt: entry.completedAt,
          durationLabel: `${entry.durationMinutes} min`,
          details: [
            { label: "Before", value: entry.moodBefore },
            { label: "After", value: entry.moodAfter },
            { label: "Points", value: `${entry.energyPoints}` },
          ],
        })),
        ...preferences.quickHistory.map((entry) => ({
          id: entry.id,
          type: "quick" as const,
          title: entry.moodLabel ?? entry.chakraName,
          subtitle: entry.chakraName,
          completedAt: entry.completedAt,
          durationLabel: entry.durationLabel,
          details: [
            { label: "Listened", value: `${entry.listenedMinutes} min` },
            { label: "Type", value: "Quick play" },
          ],
        })),
      ].sort((a, b) => +new Date(b.completedAt) - +new Date(a.completedAt)),
    [preferences.quickHistory, progress.history],
  );

  if (items.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 text-sm text-slate-300">
        No listening history yet. Start a quick session from Relax or a structured session from Journey.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((entry) => (
        <article key={entry.id} className="rounded-[1.75rem] border border-white/10 bg-white/6 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{entry.title}</p>
              <p className="mt-1 text-sm text-slate-400">{entry.subtitle}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                {entry.type === "journey" ? "Journey session" : "Quick listening"}
              </p>
            </div>
            <p className="text-sm text-slate-400">
              {new Date(entry.completedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
            <div>
              <p className="text-slate-400">Duration</p>
              <p>{entry.durationLabel}</p>
            </div>
            {entry.details.map((detail) => (
              <div key={detail.label}>
                <p className="text-slate-400">{detail.label}</p>
                <p>{detail.value}</p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

import { AppPageHeader, ChakraBadge, ExpandableCard } from "@/components/chakra-path-ui";
import { GlassCard, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { deleteJournalEntry } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

const filters = ["All", "Reflections", "Resets", "Notes"] as const;

export function MvpHistoryScreen() {
  const state = useMvpState();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const entries = useMemo(() => {
    return state.entries.filter((entry) => {
      if (filter === "Reflections") return !entry.isTemporary;
      if (filter === "Resets") return Boolean(entry.plan);
      if (filter === "Notes") return Boolean(entry.feedback?.reflection);
      return true;
    });
  }, [filter, state.entries]);

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <AppPageHeader title="Journey" copy="Your past reflections." backHref="/" />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium ${filter === item ? "border-[var(--ip-purple)] bg-[var(--ip-lavender)] text-[var(--ip-purple)]" : "border-[var(--ip-border)] bg-white/78 text-[var(--ip-body)]"}`}
            >
              {item}
            </button>
          ))}
        </div>

        {entries.length === 0 ? (
          <GlassCard className="p-4 text-sm text-[var(--ip-body)]">No saved reflections yet. Start Expressing and choose Save to My Journey when something feels worth remembering.</GlassCard>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const summary = entry.analysis?.understandingSummary ?? entry.analysis?.summary ?? entry.title;
              const primaryChakra = entry.analysis?.chakraAssociations[0]?.chakra;
              return (
                <ExpandableCard
                  key={entry.id}
                  title={new Date(entry.createdAt).toLocaleDateString()}
                  summary={summary}
                >
                  <div className="space-y-3">
                    <p>{summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.analysis?.chakraAssociations.slice(0, 4).map((item) => (
                        <span key={item.chakra} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: chakraMap[item.chakra].accent, color: chakraMap[item.chakra].color }}>
                          {chakraMap[item.chakra].name.replace(" Chakra", "")}
                        </span>
                      ))}
                    </div>
                    {primaryChakra ? (
                      <div className="flex items-center gap-3 rounded-2xl border border-[var(--ip-border)] bg-white/70 p-3">
                        <ChakraBadge chakraId={primaryChakra} />
                        <div>
                          <p className="font-semibold text-[var(--ip-ink)]">Reset used</p>
                          <p className="text-sm text-[var(--ip-muted)]">{entry.plan ? `${entry.plan.totalDurationMinutes} min personalised reset` : "No reset yet"}</p>
                        </div>
                      </div>
                    ) : null}
                    {entry.feedback ? (
                      <p>Before and after check-in: {entry.emotionalIntensityBefore}/10 → {entry.feedback.emotionalIntensityAfter}/10</p>
                    ) : null}
                    {entry.feedback?.reflection ? <p>Saved notes: {entry.feedback.reflection}</p> : null}
                    <button type="button" onClick={() => deleteJournalEntry(entry.id)} className="text-sm font-semibold text-red-600">Delete</button>
                  </div>
                </ExpandableCard>
              );
            })}
          </div>
        )}
      </div>
    </MvpShell>
  );
}

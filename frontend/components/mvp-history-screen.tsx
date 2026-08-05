"use client";

import { useMemo, useState } from "react";

import { ChakraBadge, ExpandableCard } from "@/components/chakra-path-ui";
import { GlassCard, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { deleteJournalEntry } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

const filters = ["All", "Insights", "Sessions", "Journal", "Favourites"] as const;

export function MvpHistoryScreen() {
  const state = useMvpState();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const entries = useMemo(() => {
    return state.entries.filter((entry) => {
      if (filter === "Insights") return Boolean(entry.analysis);
      if (filter === "Sessions") return Boolean(entry.plan || entry.feedback);
      if (filter === "Journal") return !entry.isTemporary;
      if (filter === "Favourites") return false;
      return true;
    });
  }, [filter, state.entries]);

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold-light)]">Resonance archive</p>
            <h1 className="mt-1 font-serif text-[clamp(2.4rem,7vw,4.6rem)] leading-tight text-[var(--ip-ink)]">Frequency Logs</h1>
            <p className="mt-1 text-sm text-[var(--ip-body)]">Your journal, insights and healing sessions over time.</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/72 text-[var(--gold-light)]">☷</span>
        </header>

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
          <GlassCard className="pastel-cloud-card p-5 text-sm text-[var(--ip-body)]">No saved logs yet. Start Expressing and choose Save to My Journey when something feels worth remembering.</GlassCard>
        ) : (
          <div className="relative space-y-3 pl-4 before:absolute before:bottom-3 before:left-1.5 before:top-3 before:w-px before:bg-gradient-to-b before:from-[#50cbaf] before:via-[#a98bdd] before:to-[#f5b792]">
            {entries.map((entry) => {
              const summary = entry.analysis?.understandingSummary ?? entry.analysis?.summary ?? entry.title;
              const primaryChakra = entry.analysis?.chakraAssociations[0]?.chakra;
              return (
                <div key={entry.id} className="relative">
                  <span className="absolute -left-[1.08rem] top-5 h-3 w-3 rounded-full border border-white bg-[#a98bdd] shadow-[0_0_18px_rgba(169,139,221,0.42)]" />
                  <ExpandableCard
                    title={new Date(entry.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    summary={summary}
                  >
                    <div className="space-y-3">
                      <p>{summary}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.analysis?.chakraAssociations.slice(0, 4).map((item) => (
                          <span key={item.chakra} className="inline-flex items-center gap-1 rounded-full border bg-white/58 px-2.5 py-1 text-xs" style={{ borderColor: chakraMap[item.chakra].accent, color: chakraMap[item.chakra].color }}>
                            {chakraMap[item.chakra].name.replace(" Chakra", "")}
                          </span>
                        ))}
                      </div>
                      {primaryChakra ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-[var(--ip-border)] bg-white/70 p-3">
                          <ChakraBadge chakraId={primaryChakra} />
                          <div>
                            <p className="font-semibold text-[var(--ip-ink)]">Session focus</p>
                            <p className="text-sm text-[var(--ip-muted)]">{entry.plan ? `${entry.plan.totalDurationMinutes} min personalised reset` : `${chakraMap[primaryChakra].frequencyLabel} focus`}</p>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MvpShell>
  );
}

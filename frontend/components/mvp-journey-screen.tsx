"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { AppPageHeader, ChakraBadge, ExpandableCard } from "@/components/chakra-path-ui";
import { GlassCard, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { getCombinedPauseEvents, getPracticeTrends, getTimePatterns, getTopPractice, getWeeklyBarData } from "@/lib/insights";
import { deleteJournalEntry, toggleFavouriteEntry } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";
import { useProgressStore } from "@/lib/use-progress-store";

const segments = ["Overview", "Journal"] as const;
const journalFilters = ["All", "Saved", "Reflections", "Resets", "Notes"] as const;

const timeBucketColors: Record<string, string> = {
  Night: "var(--ip-purple)",
  Morning: "var(--ip-cat-focus)",
  Afternoon: "var(--ip-cat-confidence)",
  Evening: "var(--ip-cat-calm)",
  "Late Evening": "var(--ip-cat-sleep)",
};

export function MvpJourneyScreen() {
  const state = useMvpState();
  const progress = useProgressStore();
  const initialTab = useSearchParams().get("tab");
  const [segment, setSegment] = useState<(typeof segments)[number]>(initialTab === "journal" ? "Journal" : "Overview");
  const [journalFilter, setJournalFilter] = useState<(typeof journalFilters)[number]>("All");

  const events = useMemo(() => getCombinedPauseEvents(state, progress), [state, progress]);
  const weekly = useMemo(() => getWeeklyBarData(events), [events]);
  const trends = useMemo(() => getPracticeTrends(events), [events]);
  const timePatterns = useMemo(() => getTimePatterns(events), [events]);
  const topPractice = useMemo(() => getTopPractice(events), [events]);
  const weekTotal = weekly.reduce((sum, day) => sum + day.count, 0);
  const maxDay = Math.max(1, ...weekly.map((day) => day.count));

  const journalEntries = useMemo(() => {
    return state.entries.filter((entry) => {
      if (journalFilter === "Saved") return Boolean(entry.favourite);
      if (journalFilter === "Reflections") return !entry.isTemporary;
      if (journalFilter === "Resets") return Boolean(entry.plan);
      if (journalFilter === "Notes") return Boolean(entry.feedback?.reflection);
      return true;
    });
  }, [journalFilter, state.entries]);

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <AppPageHeader title="Journey" copy="Patterns, progress and your saved reflections." />

        <div className="flex gap-2">
          {segments.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSegment(item)}
              className={`min-h-9 flex-1 rounded-full border text-sm font-medium transition ${
                segment === item ? "border-purple-300 bg-purple-100 text-[var(--ip-purple)]" : "border-[var(--ip-border)] bg-white/70 text-[var(--ip-muted)]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {segment === "Overview" ? (
          <div className="space-y-3.5">
            <GlassCard className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ip-muted)]">This Week</p>
              <p className="mt-1 font-serif text-4xl text-[var(--ip-ink)]">{weekTotal} <span className="text-xl font-sans text-[var(--ip-muted)]">Pauses</span></p>
              <div className="mt-4 flex items-end justify-between gap-1.5" style={{ height: "5.5rem" }}>
                {weekly.map((day) => (
                  <div key={day.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-full bg-[linear-gradient(180deg,var(--ip-purple-2),var(--ip-purple))]"
                      style={{ height: `${Math.max(6, (day.count / maxDay) * 100)}%` }}
                    />
                    <span className="text-[0.65rem] text-[var(--ip-muted)]">{day.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--ip-border)] pt-3 text-sm">
                <div>
                  <p className="text-[var(--ip-muted)]">Top Practice</p>
                  <p className="font-semibold text-[var(--ip-ink)]">{topPractice ? `${topPractice.label} · ${topPractice.count} times` : "Not yet"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[var(--ip-muted)]">Current Streak</p>
                  <p className="font-semibold text-[var(--ip-ink)]">{progress.currentStreak} days</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="font-serif text-xl text-[var(--ip-ink)]">Practice Trends</p>
              <p className="text-xs text-[var(--ip-muted)]">vs last week</p>
              <div className="mt-3 space-y-2.5">
                {trends.map(({ category, thisWeek, trend }) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--ip-ink)]">{category.label}</span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="text-[var(--ip-muted)]">{thisWeek}</span>
                      <span aria-hidden="true" style={{ color: trend === "up" ? "#4fb3a9" : trend === "down" ? "#d1587a" : "var(--ip-muted)" }}>
                        {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="font-serif text-xl text-[var(--ip-ink)]">Time Patterns</p>
              {timePatterns.total === 0 ? (
                <p className="mt-2 text-sm text-[var(--ip-body)]">Complete a few pauses to see when you practice most.</p>
              ) : (
                <div className="mt-3 flex items-center gap-4">
                  <svg width={120} height={120} viewBox="0 0 120 120" className="shrink-0">
                    <g transform="rotate(-90 60 60)">
                      <circle cx={60} cy={60} r={52} fill="none" stroke="var(--ip-lavender)" strokeWidth={16} />
                      {(() => {
                        const circumference = 2 * Math.PI * 52;
                        let offset = 0;
                        return timePatterns.segments
                          .filter((segmentItem) => segmentItem.percent > 0)
                          .map((segmentItem) => {
                            const dash = (segmentItem.percent / 100) * circumference;
                            const el = (
                              <circle
                                key={segmentItem.label}
                                cx={60}
                                cy={60}
                                r={52}
                                fill="none"
                                stroke={timeBucketColors[segmentItem.label]}
                                strokeWidth={16}
                                strokeDasharray={`${dash} ${circumference - dash}`}
                                strokeDashoffset={-offset}
                              />
                            );
                            offset += dash;
                            return el;
                          });
                      })()}
                    </g>
                  </svg>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {timePatterns.segments.filter((segmentItem) => segmentItem.value > 0).map((segmentItem) => (
                      <div key={segmentItem.label} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 text-[var(--ip-body)]">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: timeBucketColors[segmentItem.label] }} />
                          {segmentItem.label}
                        </span>
                        <span className="text-[var(--ip-muted)]">{segmentItem.percent}%</span>
                      </div>
                    ))}
                    {timePatterns.topBucket ? (
                      <p className="mt-2 text-xs text-[var(--ip-muted)]">
                        You pause most at {timePatterns.topBucket.range}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {journalFilters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setJournalFilter(item)}
                  className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium ${journalFilter === item ? "border-[var(--ip-purple)] bg-[var(--ip-lavender)] text-[var(--ip-purple)]" : "border-[var(--ip-border)] bg-white/78 text-[var(--ip-body)]"}`}
                >
                  {item}
                </button>
              ))}
            </div>

            {journalEntries.length === 0 ? (
              <GlassCard className="p-4 text-sm text-[var(--ip-body)]">No saved reflections yet. Start Expressing and choose Save to My Journey when something feels worth remembering.</GlassCard>
            ) : (
              <div className="space-y-2">
                {journalEntries.map((entry) => {
                  const summary = entry.analysis?.understandingSummary ?? entry.analysis?.summary ?? entry.title;
                  const primaryChakra = entry.analysis?.chakraAssociations[0]?.chakra;
                  return (
                    <ExpandableCard key={entry.id} title={new Date(entry.createdAt).toLocaleDateString()} summary={summary}>
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
                        <div className="flex items-center gap-4">
                          <button type="button" onClick={() => toggleFavouriteEntry(entry.id)} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--ip-purple)]">
                            <span aria-hidden="true">{entry.favourite ? "♥" : "♡"}</span> {entry.favourite ? "Saved" : "Save"}
                          </button>
                          <button type="button" onClick={() => deleteJournalEntry(entry.id)} className="text-sm font-semibold text-red-600">Delete</button>
                        </div>
                      </div>
                    </ExpandableCard>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </MvpShell>
  );
}

"use client";

import { GlassCard, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { useMvpState } from "@/lib/use-mvp-state";

function countItems(items: string[]) {
  return Object.entries(items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
}

export function InsightsScreen() {
  const state = useMvpState();
  const analysed = state.entries.filter((entry) => entry.analysis);
  const emotions = countItems(analysed.flatMap((entry) => entry.analysis?.emotions.map((emotion) => emotion.name) ?? []));
  const triggers = countItems(analysed.flatMap((entry) => entry.analysis?.triggers ?? []));
  const chakras = countItems(analysed.flatMap((entry) => entry.analysis?.chakraAssociations.map((item) => item.chakra) ?? []));
  const feedback = state.entries.filter((entry) => entry.feedback);
  const averageShift = feedback.length
    ? feedback.reduce((sum, entry) => sum + (entry.emotionalIntensityBefore - (entry.feedback?.emotionalIntensityAfter ?? entry.emotionalIntensityBefore)), 0) / feedback.length
    : 0;

  return (
    <MvpShell>
      <div className="space-y-5">
        <SectionTitle title="Insights" copy="Patterns are supportive reflections from your journal and feedback. They are not diagnoses." />
        {analysed.length < 3 ? (
          <GlassCard className="p-6">
            <p className="font-serif text-2xl text-[var(--gold-light)]">We are still learning what supports you.</p>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Complete a few more journal and healing sessions to unlock personal insights.
            </p>
          </GlassCard>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <InsightCard title="Recurring emotions" items={emotions} fallback="No recurring emotions yet." />
          <InsightCard title="Repeated situations" items={triggers} fallback="No repeated situations yet." />
          <InsightCard
            title="Frequent chakra themes"
            items={chakras.map(([chakraId, count]) => [chakraMap[chakraId as keyof typeof chakraMap]?.name ?? chakraId, count])}
            fallback="No chakra themes yet."
          />
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold-muted)]">Before / after</p>
            <p className="mt-4 font-serif text-4xl text-[var(--gold-light)]">{averageShift.toFixed(1)}</p>
            <p className="mt-2 text-sm leading-6 text-stone-300">Average self-reported intensity reduction after completed sessions.</p>
          </GlassCard>
        </div>

        <GlassCard className="p-5">
          <p className="font-serif text-2xl text-[var(--gold-light)]">Current focus</p>
          <p className="mt-3 text-sm leading-6 text-stone-300">
            {chakras[0]
              ? `${chakraMap[chakras[0][0] as keyof typeof chakraMap]?.name ?? chakras[0][0]} appears most often in your recent entries. This may suggest a useful traditional chakra theme to focus on.`
              : "Your current focus will appear after more journal analysis."}
          </p>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

function InsightCard({ title, items, fallback }: { title: string; items: Array<[string, number]>; fallback: string }) {
  return (
    <GlassCard className="p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold-muted)]">{title}</p>
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.slice(0, 4).map(([item, count]) => (
            <div key={item} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <span className="text-stone-100">{item}</span>
              <span className="text-sm text-stone-400">{count}×</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-400">{fallback}</p>
      )}
    </GlassCard>
  );
}

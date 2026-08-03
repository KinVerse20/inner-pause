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
  const saved = state.entries.filter((entry) => !entry.isTemporary && entry.analysis);
  const emotions = countItems(saved.flatMap((entry) => entry.analysis?.emotions.map((emotion) => emotion.name) ?? []));
  const triggers = countItems(saved.flatMap((entry) => entry.analysis?.triggers ?? []));
  const chakras = countItems(saved.flatMap((entry) => entry.analysis?.chakraAssociations.map((item) => item.chakra) ?? []));
  const feedback = saved.filter((entry) => entry.feedback);
  const helpful = countItems(feedback.map((entry) => entry.feedback?.helpfulSection ?? "").filter(Boolean));

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <SectionTitle title="Your Emotional Journey" copy="Notice what affects you and what helps you feel better." />

        {saved.length < 3 ? (
          <GlassCard className="p-4">
            <p className="font-serif text-xl text-[#130b4f]">Your patterns will appear here as you save more reflections.</p>
            <p className="mt-2 text-sm leading-5 text-[#4b3f86]">Save a few summaries to start seeing what repeats and what supports you best.</p>
          </GlassCard>
        ) : (
          <GlassCard className="p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[#7c3aed]">Patterns We Noticed</p>
            <p className="mt-2 text-sm leading-5 text-[#4b3f86]">
              {triggers[0]
                ? `You often feel unsettled around ${triggers[0][0].toLowerCase()}. This may be useful to notice over time.`
                : "Your saved reflections are beginning to show repeated themes."}
            </p>
          </GlassCard>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <InsightCard title="Common Emotions" items={emotions} fallback="Common emotions will appear as you save more reflections." />
          <InsightCard title="Repeated Situations" items={triggers} fallback="Repeated situations will appear as your journey grows." />
          <InsightCard
            title="Chakra Themes"
            items={chakras.map(([chakraId, count]) => [chakraMap[chakraId as keyof typeof chakraMap]?.name ?? chakraId, count])}
            fallback="Chakra themes will appear after more saved reflections."
          />
          <InsightCard title="What Helps You Most" items={helpful} fallback="Helpful session patterns will appear after completed resets." />
        </div>

        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[#7c3aed]">This Week&apos;s Reflection</p>
          <p className="mt-2 text-sm leading-5 text-[#4b3f86]">
            {saved[0]?.analysis?.understandingSummary ?? saved[0]?.analysis?.summary ?? "Save a reflection this week to see a gentle summary here."}
          </p>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

function InsightCard({ title, items, fallback }: { title: string; items: Array<[string, number]>; fallback: string }) {
  return (
    <GlassCard className="p-3.5">
      <p className="text-xs uppercase tracking-[0.22em] text-[#7c3aed]">{title}</p>
      {items.length ? (
        <div className="mt-3 space-y-2">
          {items.slice(0, 4).map(([item, count]) => (
            <div key={item} className="flex items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-white/70 px-3 py-2">
              <span className="line-clamp-1 text-sm text-[#26156f]">{item}</span>
              <span className="text-sm text-[#6d5ea8]">{count} saved</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-5 text-[#4b3f86]">{fallback}</p>
      )}
    </GlassCard>
  );
}

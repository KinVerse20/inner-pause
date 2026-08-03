"use client";

import { AppPageHeader, InsightProgressBar } from "@/components/chakra-path-ui";
import { GlassCard, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { useMvpState } from "@/lib/use-mvp-state";

function countItems(items: string[]) {
  return Object.entries(items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
}

const helpCopy: Record<string, string> = {
  Breathwork: "Calms your mind",
  "Guided Arrival": "Helps you settle",
  "Ground & Release": "Brings stability",
  "Calm & Integrate": "Restores balance",
  "Gentle Cue": "Returns your focus",
};

export function InsightsScreen() {
  const state = useMvpState();
  const saved = state.entries.filter((entry) => !entry.isTemporary && entry.analysis);
  const chakraCounts = countItems(saved.flatMap((entry) => entry.analysis?.chakraAssociations.map((item) => item.chakra) ?? []));
  const totalChakraMentions = chakraCounts.reduce((sum, [, count]) => sum + count, 0);
  const helpful = countItems(saved.filter((entry) => entry.feedback).map((entry) => entry.feedback?.helpfulSection ?? "").filter(Boolean));

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <AppPageHeader title="Insights" copy="Patterns. Progress. Possibilities." backHref="/" />

        {saved.length < 3 ? (
          <GlassCard className="p-4">
            <p className="font-serif text-xl text-[var(--ip-ink)]">Your patterns will appear here as you save more reflections and complete more resets.</p>
            <p className="mt-2 text-sm text-[var(--ip-body)]">No fake metrics are shown. Your insights are built only from your saved journey.</p>
          </GlassCard>
        ) : (
          <>
            <GlassCard className="p-4">
              <p className="font-serif text-xl text-[var(--ip-ink)]">Recurring Chakra Themes</p>
              <div className="mt-4 space-y-3">
                {chakraCounts.slice(0, 5).map(([chakraId, count]) => {
                  const chakra = chakraMap[chakraId as keyof typeof chakraMap];
                  const percent = totalChakraMentions ? Math.round((count / totalChakraMentions) * 100) : 0;
                  return <InsightProgressBar key={chakraId} label={chakra.name.replace(" Chakra", "")} value={percent} color={chakra.color} />;
                })}
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="font-serif text-xl text-[var(--ip-ink)]">What Helps You Most</p>
              <div className="mt-3 space-y-2">
                {helpful.length ? helpful.slice(0, 4).map(([item]) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-[var(--ip-border)] bg-white/72 p-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--ip-lavender)] text-[var(--ip-purple)]">✦</span>
                    <div>
                      <p className="font-semibold text-[var(--ip-ink)]">{item}</p>
                      <p className="text-sm text-[var(--ip-muted)]">{helpCopy[item] ?? "Supports your reset"}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-[var(--ip-body)]">Complete a few resets to see what helps you most.</p>
                )}
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </MvpShell>
  );
}

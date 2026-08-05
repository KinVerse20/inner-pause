"use client";

import { useState } from "react";

import { BlushCard, SunriseScene } from "@/components/morning-blush-ui";
import { MvpShell } from "@/components/mvp-shell";
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
  const [exploring, setExploring] = useState(false);
  const saved = state.entries.filter((entry) => !entry.isTemporary && entry.analysis);
  const latest = saved[0]?.analysis;
  const chakraCounts = countItems(saved.flatMap((entry) => entry.analysis?.chakraAssociations.map((item) => item.chakra) ?? []));
  const triggerCounts = countItems(saved.flatMap((entry) => entry.analysis?.triggers ?? []));
  const mainFeeling = latest?.emotions[0]?.name ?? "Peaceful";
  const emotionalFocus = latest?.chakraAssociations[0]?.chakra ? chakraMap[latest.chakraAssociations[0].chakra].name.replace(" Chakra", "") : "Consistency";
  const averageIntensity = saved.length ? saved.reduce((sum, entry) => sum + (entry.emotionalIntensityBefore ?? 6), 0) / saved.length : 6;
  const balanceScore = saved.length ? Math.max(42, Math.min(92, Math.round(100 - averageIntensity * 5))) : 70;

  return (
    <MvpShell>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,1fr)] lg:items-start">
        <SunriseScene variant="lake">
          <div className="reference-phone-canvas flex flex-col justify-between px-5 py-5 text-center sm:py-6">
            <div className="mx-auto max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold-light)]">Insight</p>
              <h1 className="mt-2 font-serif text-[clamp(2.45rem,8vw,4.6rem)] leading-tight text-[var(--ip-ink)]">Take a breath</h1>
              <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">{mainFeeling} is asking for gentler attention.</p>
            </div>
            <div className="insight-flow-wave my-5" aria-hidden="true" />
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniCard label="Feeling" value={mainFeeling} />
              <MiniCard label="Focus" value={emotionalFocus} />
            </div>
            <button type="button" onClick={() => setExploring((value) => !value)} className="mt-4 min-h-12 w-full rounded-full border border-[rgba(255,138,42,0.55)] bg-[rgba(244,122,34,0.12)] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold-light)] shadow-[0_0_26px_rgba(244,122,34,0.12)]">
              {exploring ? "Hide more" : "See more"}
            </button>
          </div>
        </SunriseScene>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5">
          <BlushCard className="p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--ip-muted)]">Balance</p>
            <p className="mt-2 font-serif text-4xl text-[var(--ip-ink)]">{balanceScore}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[var(--gold-primary)] shadow-[0_0_14px_rgba(255,138,42,0.7)]" style={{ width: `${balanceScore}%` }} />
            </div>
          </BlushCard>

          {saved.length < 3 ? (
            <BlushCard className="p-4">
              <p className="text-xl text-[var(--ip-ink)]">Your patterns will appear as you save more reflections.</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">No fake metrics are shown. Insights are built from your saved journey.</p>
            </BlushCard>
          ) : null}

          {exploring ? (
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
              <InsightCard title="Emotional patterns" items={countItems(saved.map((entry) => entry.analysis?.emotions[0]?.name ?? "").filter(Boolean)).slice(0, 3).map(([item]) => item)} />
              <InsightCard title="Common triggers" items={triggerCounts.slice(0, 3).map(([item]) => item)} />
              <InsightCard title="Improvement areas" items={chakraCounts.slice(0, 3).map(([chakraId]) => chakraMap[chakraId as keyof typeof chakraMap]?.meaning ?? chakraId)} />
              <InsightCard title="Helpful practices" items={["Breath Flow", "Healing Music", "Journal Thought"]} />
            </div>
          ) : null}
        </div>
      </div>
    </MvpShell>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4 text-left shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
      <p className="minimal-label text-[0.65rem]">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold text-[var(--ip-ink)]">{value}</p>
    </div>
  );
}

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return (
    <details className="rounded-[1.45rem] border border-white/10 bg-white/[0.035] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <summary className="cursor-pointer text-xl text-[var(--ip-ink)]">{title}</summary>
      <div className="mt-3 grid gap-2">
        {items.length ? items.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-[var(--ip-body)]">{item}</div>
        )) : <p className="text-sm text-[var(--ip-body)]">No data yet.</p>}
      </div>
    </details>
  );
}

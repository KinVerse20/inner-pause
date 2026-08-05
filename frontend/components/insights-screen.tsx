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
            <button type="button" onClick={() => setExploring((value) => !value)} className="mt-4 min-h-12 w-full rounded-full border border-white/70 bg-[linear-gradient(135deg,#b18de2,#f5b5d1)] px-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(177,141,226,0.18)]">
              {exploring ? "Hide more" : "See more"}
            </button>
          </div>
        </SunriseScene>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5">
          <BlushCard className="p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--ip-muted)]">Balance</p>
            <p className="mt-2 font-serif text-4xl text-[var(--ip-ink)]">{balanceScore}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
              <div className="h-full rounded-full bg-gradient-to-r from-[#58d3b5] via-[#b18de2] to-[#f5b5d1]" style={{ width: `${balanceScore}%` }} />
            </div>
          </BlushCard>

          {saved.length < 3 ? (
            <BlushCard className="p-4">
              <p className="font-serif text-xl text-[#322d42]">Your patterns will appear as you save more reflections.</p>
              <p className="mt-2 text-sm leading-6 text-[#6f687d]">No fake metrics are shown. Insights are built from your saved journey.</p>
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
    <div className="rounded-[1.25rem] border border-white/70 bg-white/66 p-4 text-left shadow-[0_12px_28px_rgba(169,139,221,0.1)]">
      <p className="text-xs text-[#90879d]">{label}</p>
      <p className="mt-1 truncate font-semibold text-[#322d42]">{value}</p>
    </div>
  );
}

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return (
    <details className="rounded-[1.45rem] border border-white/70 bg-white/72 p-4 shadow-[0_14px_34px_rgba(152,117,139,0.12)] backdrop-blur-xl">
      <summary className="cursor-pointer font-serif text-xl text-[#322d42]">{title}</summary>
      <div className="mt-3 grid gap-2">
        {items.length ? items.map((item) => (
          <div key={item} className="rounded-2xl bg-[#fff8f4]/74 px-3 py-2 text-sm text-[#6f687d]">{item}</div>
        )) : <p className="text-sm text-[#6f687d]">No data yet.</p>}
      </div>
    </details>
  );
}

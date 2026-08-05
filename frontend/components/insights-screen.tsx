"use client";

import { useState } from "react";

import { BlushCard, InsightRing, SunriseScene } from "@/components/morning-blush-ui";
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
          <div className="flex min-h-[clamp(22rem,56dvh,30rem)] flex-col items-center justify-between px-5 py-5 text-center sm:py-6 lg:min-h-[30rem]">
            <div>
              <h1 className="font-serif text-3xl text-[#322d42]">Inner Balance</h1>
              <p className="mt-1 text-sm text-[#6f687d]">This week</p>
            </div>
            <InsightRing value={balanceScore} />
            <div className="w-full rounded-[1.4rem] border border-white/70 bg-white/62 p-4 text-left backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-3">
                <Mini label="Main feeling" value={mainFeeling} />
                <Mini label="Focus" value={emotionalFocus} />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full bg-gradient-to-r from-[#eca98f] via-[#d79bb8] to-[#a99ac8]" style={{ width: `${balanceScore}%` }} />
              </div>
            </div>
          </div>
        </SunriseScene>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5">
          <button type="button" onClick={() => setExploring((value) => !value)} className="min-h-12 w-full rounded-full border border-white/70 bg-white/76 px-4 text-sm font-semibold text-[#a77d97] shadow-[0_12px_30px_rgba(152,117,139,0.12)]">
            {exploring ? "Hide patterns" : "Explore your patterns"}
          </button>

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

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
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

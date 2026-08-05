"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ChakraBadge, ExpandableCard } from "@/components/chakra-path-ui";
import { BlushCard, SunriseScene } from "@/components/morning-blush-ui";
import { GlassCard, GoldButton, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { savePlan, updateJournalEntry } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

export function AnalysisScreen() {
  const router = useRouter();
  const entryId = useSearchParams().get("entry");
  const state = useMvpState();
  const entry = state.entries.find((item) => item.id === entryId);
  const analysis = entry?.analysis;
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");

  if (!entry || !analysis) {
    return (
      <MvpShell>
        <GlassCard className="mx-auto max-w-xl p-5">
          <p className="text-[var(--ip-body)]">No emotional insight found. Share what you feel first.</p>
          <GoldButton className="mt-4" onClick={() => router.replace("/journal")}>Start Expressing</GoldButton>
        </GlassCard>
      </MvpShell>
    );
  }

  const understanding = analysis.understandingSummary ?? analysis.summary;
  const saveSummary = () => {
    updateJournalEntry(entry.id, { analysis: { ...analysis, understandingSummary: summaryDraft, summary: summaryDraft } });
    setEditingSummary(false);
  };

  const beginReset = () => {
    savePlan(entry.id);
    router.push(`/healing?entry=${entry.id}`);
  };

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <SunriseScene variant="lake">
          <div className="grid min-h-[clamp(30rem,70dvh,34rem)] gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:p-7">
            <div className="min-w-0">
              <button type="button" onClick={() => router.push("/journal")} className="mb-5 min-h-10 rounded-full border border-[var(--gold-border-soft)] bg-white/8 px-4 text-sm text-[var(--ip-body)]">
                ← Back to journal
              </button>
              <h1 className="font-serif text-[clamp(2rem,7vw,4rem)] leading-tight text-[var(--cream)]">Here’s what we noticed.</h1>
              <p className="mt-2 max-w-xl text-sm text-[var(--ip-body)]">Your voice says so much. We hold space with awareness and truth.</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {analysis.emotions.slice(0, 5).map((emotion) => (
                  <details key={emotion.name} className="group rounded-full border border-[var(--gold-border-soft)] bg-white/8 px-4 py-2 text-sm text-[var(--cream)] open:rounded-2xl">
                    <summary className="cursor-pointer list-none">{emotion.name}</summary>
                    {emotion.explanation ? <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--ip-body)]">{emotion.explanation}</p> : null}
                  </details>
                ))}
              </div>

              <BlushCard className="mt-5 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--gold-muted)]">A gentle reflection</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--ip-body)]">{understanding}</p>
                  </div>
                  <button type="button" onClick={() => { setSummaryDraft(understanding); setEditingSummary(true); }} className="shrink-0 text-sm font-semibold text-[var(--gold-light)]">
                    Review
                  </button>
                </div>
                {editingSummary ? (
                  <div className="mt-3 space-y-3">
                    <textarea value={summaryDraft} onChange={(event) => setSummaryDraft(event.target.value)} className="soft-input min-h-28 w-full rounded-2xl p-3 outline-none" />
                    <GoldButton onClick={saveSummary}>Save reflection</GoldButton>
                  </div>
                ) : null}
              </BlushCard>

              <GoldButton className="mt-5 w-full sm:w-auto sm:px-8" disabled={analysis.safetyFlag} onClick={beginReset}>
                Continue my healing
              </GoldButton>
            </div>

            <BlushCard className="p-4">
              <p className="font-serif text-xl text-[var(--gold-light)]">Your journey</p>
              <div className="mt-4 space-y-4 text-sm text-[var(--ip-body)]">
                <JourneyLine label="Reflections" value={String(state.entries.filter((item) => !item.isTemporary).length)} />
                <JourneyLine label="Streak" value={`${Math.max(1, state.entries.length)} days`} />
                <JourneyLine label="Time with you" value={`${Math.max(2, Math.round(state.entries.length * 7))} min`} />
                <JourneyLine label="Preferred way" value="Speak" />
              </div>
            </BlushCard>
          </div>
        </SunriseScene>

        <section className="grid gap-3 lg:grid-cols-2">
          {analysis.chakraAssociations.map((item) => {
            const chakra = chakraMap[item.chakra];
            return (
              <ExpandableCard key={item.chakra} title={chakra.name.replace(" Chakra", "")} summary={item.emotionalTheme ?? chakra.meaning}>
                <div className="flex gap-3">
                  <ChakraBadge chakraId={item.chakra} />
                  <div className="min-w-0 space-y-2">
                    <p><span className="font-semibold text-[var(--gold-light)]">Why it may be relevant:</span> {item.reason}</p>
                    <p><span className="font-semibold text-[var(--gold-light)]">How the reset may support you:</span> {item.sessionSupport ?? chakra.purpose}</p>
                  </div>
                </div>
              </ExpandableCard>
            );
          })}
        </section>
      </div>
    </MvpShell>
  );
}

function JourneyLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--gold-border-soft)] pb-3 last:border-0 last:pb-0">
      <span>{label}</span>
      <span className="font-serif text-lg text-[var(--gold-light)]">{value}</span>
    </div>
  );
}

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
  const primaryEmotion = analysis.emotions[0]?.name ?? "Reflective";
  const primaryChakra = analysis.chakraAssociations[0];
  const secondaryChakra = analysis.chakraAssociations[1];
  const resonanceMatch = Math.max(52, Math.min(96, Math.round((primaryChakra?.confidence ?? 0.72) * 100)));
  const emotionalDensity = Math.max(20, Math.min(100, Math.round(analysis.emotions.slice(0, 4).reduce((sum, emotion) => sum + (emotion.intensity ?? 5), 0) * 6)));

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <SunriseScene>
          <div className="grid min-h-[clamp(30rem,70dvh,36rem)] gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-center lg:p-7">
            <div className="min-w-0 text-center lg:text-left">
              <button type="button" onClick={() => router.push("/journal")} className="mb-5 min-h-10 rounded-full border border-[var(--gold-border-soft)] bg-white/64 px-4 text-sm text-[var(--ip-body)]">
                ← Back to journal
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold-light)]">Frequency decoding</p>
              <h1 className="mt-2 font-serif text-[clamp(2.4rem,8vw,5rem)] leading-[0.92] text-[var(--ip-ink)]">Aligning<br className="hidden sm:block" /> Frequencies...</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--ip-body)] lg:mx-0">
                Decoding your emotional reflection into gentle resonance patterns.
              </p>

              <div className="mx-auto my-5 grid place-items-center lg:mx-0">
                <div className="pastel-frequency-orb" aria-hidden="true" />
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Metric label="Dominant frequency" value={primaryChakra ? chakraMap[primaryChakra.chakra].frequencyLabel : "639 Hz"} />
                <Metric label="Resonance match" value={`${resonanceMatch}%`} />
                <Metric label="Emotional density" value={`${emotionalDensity}%`} />
              </div>
            </div>

            <BlushCard className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold-light)]">Aura detected</p>
              <h2 className="mt-2 font-serif text-3xl leading-tight text-[var(--ip-ink)]">{primaryEmotion} Resonance</h2>
              <div className="pastel-wave-visual mt-4 rounded-[1.2rem] border border-[var(--gold-border-soft)]" />
              <div className="mt-4 space-y-3 text-sm text-[var(--ip-body)]">
                <JourneyLine label="Dominant chakra" value={primaryChakra ? chakraMap[primaryChakra.chakra].name.replace(" Chakra", "") : "Heart"} />
                <JourneyLine label="Secondary chakra" value={secondaryChakra ? chakraMap[secondaryChakra.chakra].name.replace(" Chakra", "") : "Throat"} />
                <JourneyLine label="Key pattern" value={analysis.emotions[0]?.name ?? "Reflection"} />
              </div>
              <GoldButton className="mt-4 w-full" disabled={analysis.safetyFlag} onClick={beginReset}>
                View Emotional Insight
              </GoldButton>
            </BlushCard>
          </div>
        </SunriseScene>

        <SunriseScene variant="lake">
          <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:p-7">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold-light)]">State analysis</p>
              <h2 className="mt-2 font-serif text-[clamp(2rem,7vw,4rem)] leading-tight text-[var(--ip-ink)]">Luminous {primaryEmotion}</h2>
              <p className="mt-2 max-w-xl text-sm text-[var(--ip-body)]">Here’s what we noticed in your reflection.</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {analysis.emotions.slice(0, 5).map((emotion) => (
                  <details key={emotion.name} className="group rounded-full border border-[var(--gold-border-soft)] bg-white/58 px-4 py-2 text-sm text-[var(--ip-ink)] open:rounded-2xl">
                    <summary className="cursor-pointer list-none">{emotion.name}</summary>
                    {emotion.explanation ? <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--ip-body)]">{emotion.explanation}</p> : null}
                  </details>
                ))}
              </div>

              <BlushCard className="mt-5 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--gold-muted)]">Emotional overview</p>
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
                Continue Healing
              </GoldButton>
              <button type="button" onClick={() => router.push("/journey")} className="ml-0 mt-3 min-h-11 w-full rounded-full border border-[var(--gold-border-soft)] bg-white/64 px-4 text-sm font-semibold text-[var(--gold-light)] sm:ml-3 sm:mt-0 sm:w-auto">
                View Chakra Map
              </button>
            </div>

            <BlushCard className="p-4">
              <p className="font-serif text-xl text-[var(--ip-ink)]">Your journey</p>
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
                    <p><span className="font-semibold text-[var(--gold-light)]">Suggested gentle action:</span> {item.sessionSupport ?? chakra.purpose}</p>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--gold-border-soft)] bg-white/58 p-3 text-left shadow-[0_12px_28px_rgba(169,139,221,0.1)]">
      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--ip-muted)]">{label}</p>
      <p className="mt-1 font-serif text-xl text-[var(--ip-ink)]">{value}</p>
    </div>
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

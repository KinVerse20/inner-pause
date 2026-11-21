"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AppPageHeader, ChakraBadge, ChakraPath, ExpandableCard } from "@/components/chakra-path-ui";
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
  const activeChakras = analysis.chakraAssociations.map((item) => item.chakra);

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
        <AppPageHeader title="Understand" copy="Here’s what we’re seeing." backHref="/journal" />

        <div data-testid="emotional-insight-artwork" className="rounded-[1.5rem] border border-[var(--ip-border)] bg-white/72 py-4 shadow-[0_14px_34px_rgba(108,62,244,0.1)]">
          <ChakraPath active={activeChakras} compact />
        </div>

        <GlassCard className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--ip-purple)]">Your Reflection</p>
              <h1 className="mt-1 font-serif text-2xl text-[var(--ip-ink)]">Here is what I understood</h1>
            </div>
            <button type="button" onClick={() => { setSummaryDraft(understanding); setEditingSummary(true); }} className="text-sm font-semibold text-[var(--ip-purple)]">
              Edit Reflection
            </button>
          </div>
          {editingSummary ? (
            <div className="mt-3 space-y-3">
              <textarea value={summaryDraft} onChange={(event) => setSummaryDraft(event.target.value)} className="soft-input min-h-28 w-full rounded-2xl p-3 outline-none" />
              <GoldButton onClick={saveSummary}>Save</GoldButton>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[var(--ip-body)]">{understanding}</p>
          )}
        </GlassCard>

        <section className="space-y-2">
          <h2 className="px-1 font-serif text-xl text-[var(--ip-ink)]">Chakra Themes</h2>
          {analysis.chakraAssociations.map((item) => {
            const chakra = chakraMap[item.chakra];
            return (
              <ExpandableCard
                key={item.chakra}
                title={chakra.name.replace(" Chakra", "")}
                summary={item.emotionalTheme ?? chakra.meaning}
              >
                <div className="flex gap-3">
                  <ChakraBadge chakraId={item.chakra} />
                  <div className="min-w-0 space-y-2">
                    <p><span className="font-semibold text-[var(--ip-ink)]">Why it may be relevant:</span> {item.reason}</p>
                    <p><span className="font-semibold text-[var(--ip-ink)]">Emotional need:</span> {chakra.meaning}</p>
                    <p><span className="font-semibold text-[var(--ip-ink)]">How the reset may support you:</span> {item.sessionSupport ?? chakra.purpose}</p>
                  </div>
                </div>
              </ExpandableCard>
            );
          })}
        </section>

        <ExpandableCard title="Possible trigger" summary={analysis.triggers[0] ?? "A situation worth noticing"}>
          <div className="space-y-2">
            {analysis.keyIncidents.slice(0, 3).map((incident) => (
              <p key={incident.id}>This could be connected to {incident.text}</p>
            ))}
          </div>
        </ExpandableCard>

        <GlassCard className="p-4">
          <p className="font-serif text-xl text-[var(--ip-ink)]">This is normal.</p>
          <p className="mt-1 text-sm text-[var(--ip-body)]">Awareness is the first step to shift.</p>
        </GlassCard>

        <GoldButton className="w-full" disabled={analysis.safetyFlag} onClick={beginReset}>
          Begin My Reset
        </GoldButton>
      </div>
    </MvpShell>
  );
}

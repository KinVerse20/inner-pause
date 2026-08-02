"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ChakraGlyph } from "@/components/chakra-symbol";
import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { savePlan, updateJournalEntry } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

export function AnalysisScreen() {
  const router = useRouter();
  const entryId = useSearchParams().get("entry");
  const state = useMvpState();
  const entry = state.entries.find((item) => item.id === entryId);
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);
  const [incidentDraft, setIncidentDraft] = useState("");
  const [showAllIncidents, setShowAllIncidents] = useState(false);
  const analysis = entry?.analysis;

  const safety = analysis?.safetyFlag;
  const emotionColumns = analysis?.emotions.slice(0, 6) ?? [];
  const visibleIncidents = analysis?.keyIncidents.slice(0, showAllIncidents ? undefined : 3) ?? [];

  if (!entry || !analysis) {
    return (
      <MvpShell hideNav>
        <GlassCard className="mx-auto max-w-xl p-6">
          <p className="text-stone-300">No emotional insight found. Create a journal entry first.</p>
          <GoldButton className="mt-5" onClick={() => router.replace("/journal")}>Open Journal</GoldButton>
        </GlassCard>
      </MvpShell>
    );
  }

  const updateIncident = (incidentId: string) => {
    const nextIncidents = analysis.keyIncidents.map((incident) =>
      incident.id === incidentId ? { ...incident, text: incidentDraft } : incident,
    );
    updateJournalEntry(entry.id, { analysis: { ...analysis, keyIncidents: nextIncidents } });
    setEditingIncidentId(null);
    setIncidentDraft("");
  };

  const removeIncident = (incidentId: string) => {
    updateJournalEntry(entry.id, {
      analysis: { ...analysis, keyIncidents: analysis.keyIncidents.filter((incident) => incident.id !== incidentId) },
    });
  };

  const removeChakra = (chakraId: string) => {
    updateJournalEntry(entry.id, {
      analysis: { ...analysis, chakraAssociations: analysis.chakraAssociations.filter((item) => item.chakra !== chakraId) },
    });
  };

  const continueToPlan = () => {
    savePlan(entry.id);
    router.push(`/healing?entry=${entry.id}`);
  };

  return (
    <MvpShell hideNav>
      <div className="mx-auto max-w-3xl space-y-3.5">
        <header className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04]" aria-label="Back">←</button>
          <p className="text-sm text-[var(--gold-muted)]">Emotional Insight</p>
          <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04]">◎</span>
        </header>

        <div className="relative grid min-h-24 place-items-center overflow-hidden rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-white/[0.04]">
          <div className="absolute inset-x-0 top-8 h-14 mvp-energy-wave" />
          <div className="mvp-meditator scale-50" />
        </div>

        <SectionTitle title="Emotional Insight" copy="Here’s what we noticed. Review it before creating your plan." />

        {safety ? (
          <GlassCard className="border-red-300/30 bg-red-500/10 p-3.5">
            <h2 className="font-serif text-xl text-red-100">Pause for safety</h2>
            <p className="mt-2 text-sm leading-5 text-red-50/90">
              Your entry may suggest immediate distress or danger. The InnerPause is not therapy. Please contact local emergency support, a crisis line, or a trusted person now. A normal frequency session should not be your only support.
            </p>
          </GlassCard>
        ) : null}

        <GlassCard className="p-3.5">
          <h2 className="font-serif text-xl text-[var(--gold-light)]">Emotions in your reflection</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {emotionColumns.map((emotion) => (
              <span key={emotion.name} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-stone-200">
                {emotion.name} • {emotion.intensity}/10
              </span>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-[var(--gold-light)]">Key incidents</h2>
            {analysis.keyIncidents.length > 3 ? (
              <button type="button" onClick={() => setShowAllIncidents((value) => !value)} className="text-xs text-[var(--gold-light)]">
                {showAllIncidents ? "Show less" : "View all"}
              </button>
            ) : null}
          </div>
          <div className="mt-3 space-y-2">
            {visibleIncidents.map((incident) => (
              <div key={incident.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                {editingIncidentId === incident.id ? (
                  <div className="space-y-3">
                    <input value={incidentDraft} onChange={(event) => setIncidentDraft(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-stone-100 outline-none" />
                    <GoldButton onClick={() => updateIncident(incident.id)}>Save incident</GoldButton>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-sm leading-5 text-stone-200">{incident.text}</p>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => { setEditingIncidentId(incident.id); setIncidentDraft(incident.text); }} className="text-xs text-[var(--gold-light)]">Edit</button>
                      <button type="button" onClick={() => removeIncident(incident.id)} className="text-xs text-stone-500">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-3.5">
          <h2 className="font-serif text-xl text-[var(--gold-light)]">Related chakras</h2>
          <div className="mt-3 space-y-2">
            {analysis.chakraAssociations.map((item) => {
              const chakra = chakraMap[item.chakra];
              return (
                <div key={item.chakra} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: chakra.accent, color: chakra.accent }}>
                    <ChakraGlyph chakraId={chakra.id} className="h-7 w-7" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-100">{chakra.name}</p>
                    <p className="mt-1 line-clamp-1 text-sm leading-5 text-stone-400">{item.reason}</p>
                  </div>
                  <button type="button" onClick={() => removeChakra(item.chakra)} className="self-start text-xs text-stone-500">Remove</button>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => router.push("/journal")} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] px-4 py-2.5 text-[var(--gold-light)]">
            Review and edit
          </button>
          <GoldButton disabled={safety} onClick={continueToPlan}>Continue to Healing Plan</GoldButton>
        </div>
      </div>
    </MvpShell>
  );
}

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
  const analysis = entry?.analysis;

  const safety = analysis?.safetyFlag;
  const emotionColumns = analysis?.emotions.slice(0, 6) ?? [];

  if (!entry || !analysis) {
    return (
      <MvpShell hideNav>
        <GlassCard className="mx-auto max-w-xl p-6">
          <p className="text-stone-300">No analysis found. Create a journal entry first.</p>
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
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04]" aria-label="Back">←</button>
          <p className="text-sm text-[var(--gold-muted)]">Emotional Analysis</p>
          <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04]">◎</span>
        </header>

        <div className="relative grid min-h-56 place-items-center overflow-hidden rounded-[2rem] border border-[var(--gold-border-soft)] bg-white/[0.04]">
          <div className="absolute inset-x-0 top-16 h-24 mvp-energy-wave" />
          <div className="mvp-meditator scale-75" />
        </div>

        <SectionTitle title={"Here’s what we found\nin your entry"} copy="Review and edit this before creating your healing plan. This is supportive interpretation, not diagnosis." />

        {safety ? (
          <GlassCard className="border-red-300/30 bg-red-500/10 p-5">
            <h2 className="font-serif text-2xl text-red-100">Pause for safety</h2>
            <p className="mt-3 text-sm leading-6 text-red-50/90">
              Your entry may suggest immediate distress or danger. This app is not therapy. Please contact local emergency support, a crisis line, or a trusted person now. A normal frequency session should not be your only support.
            </p>
          </GlassCard>
        ) : null}

        <GlassCard className="p-5">
          <h2 className="font-serif text-2xl text-[var(--gold-light)]">Detected emotions</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {emotionColumns.map((emotion) => (
              <div key={emotion.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-semibold text-stone-100">{emotion.name}</p>
                <p className="mt-1 text-sm text-stone-400">{emotion.level} • {emotion.intensity}/10</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[var(--gold-primary)]" style={{ width: `${emotion.intensity * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-serif text-2xl text-[var(--gold-light)]">Key incidents</h2>
          <div className="mt-4 space-y-3">
            {analysis.keyIncidents.map((incident) => (
              <div key={incident.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                {editingIncidentId === incident.id ? (
                  <div className="space-y-3">
                    <input value={incidentDraft} onChange={(event) => setIncidentDraft(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-stone-100 outline-none" />
                    <GoldButton onClick={() => updateIncident(incident.id)}>Save incident</GoldButton>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-6 text-stone-200">{incident.text}</p>
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

        <GlassCard className="p-5">
          <h2 className="font-serif text-2xl text-[var(--gold-light)]">Related chakras</h2>
          <div className="mt-4 space-y-3">
            {analysis.chakraAssociations.map((item) => {
              const chakra = chakraMap[item.chakra];
              return (
                <div key={item.chakra} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border" style={{ borderColor: chakra.accent, color: chakra.accent }}>
                    <ChakraGlyph chakraId={chakra.id} className="h-9 w-9" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-100">{chakra.name}</p>
                    <p className="mt-1 text-sm leading-6 text-stone-400">{item.reason}</p>
                    <p className="mt-1 text-xs text-stone-500">Traditional chakra association • confidence {Math.round(item.confidence * 100)}%</p>
                  </div>
                  <button type="button" onClick={() => removeChakra(item.chakra)} className="self-start text-xs text-stone-500">Remove</button>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => router.push("/journal")} className="min-h-12 rounded-full border border-[var(--gold-border-soft)] px-5 py-3 text-[var(--gold-light)]">
            Edit Analysis
          </button>
          <GoldButton disabled={safety} onClick={continueToPlan}>Continue to Healing Plan</GoldButton>
        </div>
      </div>
    </MvpShell>
  );
}

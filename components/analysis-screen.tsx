"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ChakraGlyph } from "@/components/chakra-symbol";
import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { savePlan, updateJournalEntry } from "@/lib/mvp-storage";
import { EmotionLevel } from "@/lib/mvp-types";
import { useMvpState } from "@/lib/use-mvp-state";

export function AnalysisScreen() {
  const router = useRouter();
  const entryId = useSearchParams().get("entry");
  const state = useMvpState();
  const entry = state.entries.find((item) => item.id === entryId);
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);
  const [incidentDraft, setIncidentDraft] = useState("");
  const [showAllIncidents, setShowAllIncidents] = useState(false);
  const [showFullEntry, setShowFullEntry] = useState(false);
  const analysis = entry?.analysis;

  const safety = analysis?.safetyFlag;
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

  const updateEmotion = (index: number, updates: Partial<{ name: string; intensity: number; level: EmotionLevel; explanation: string }>) => {
    const nextEmotions = analysis.emotions.map((emotion, emotionIndex) => {
      if (emotionIndex !== index) return emotion;
      const intensity = updates.intensity ?? emotion.intensity;
      const level: EmotionLevel = intensity >= 7 ? "high" : intensity >= 4 ? "medium" : "low";
      return { ...emotion, ...updates, intensity, level };
    });
    updateJournalEntry(entry.id, { analysis: { ...analysis, emotions: nextEmotions } });
  };

  const removeEmotion = (index: number) => {
    updateJournalEntry(entry.id, { analysis: { ...analysis, emotions: analysis.emotions.filter((_, emotionIndex) => emotionIndex !== index) } });
  };

  const continueToPlan = () => {
    savePlan(entry.id);
    router.push(`/healing?entry=${entry.id}`);
  };

  const entryPreview = analysis.originalEntrySummary ?? entry.rawText;
  const hasLongEntry = entry.rawText.length > 240;
  const understanding = analysis.understandingSummary ?? analysis.summary;
  const healingApproach = analysis.healingApproachSummary ?? buildFallbackApproach(analysis.chakraAssociations.map((item) => item.chakra));

  return (
    <MvpShell hideNav>
      <div className="mx-auto max-w-3xl space-y-3.5">
        <header className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04]" aria-label="Back">←</button>
          <p className="text-sm text-[var(--gold-muted)]">Emotional Insight</p>
          <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04]">◎</span>
        </header>

        <InsightArtwork />

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
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-[var(--gold-light)]">What you shared</h2>
            {hasLongEntry ? (
              <button type="button" onClick={() => setShowFullEntry((value) => !value)} className="text-xs text-[var(--gold-light)]">
                {showFullEntry ? "Show less" : "View full entry"}
              </button>
            ) : null}
          </div>
          <p className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-5 text-stone-200">
            “{showFullEntry ? entry.rawText : entryPreview}”
          </p>
        </GlassCard>

        <GlassCard className="p-3.5">
          <h2 className="font-serif text-xl text-[var(--gold-light)]">What I understood</h2>
          <p className="mt-2 text-sm leading-5 text-stone-300">{understanding}</p>
        </GlassCard>

        <GlassCard className="p-3.5">
          <h2 className="font-serif text-xl text-[var(--gold-light)]">Emotions that may have been affected</h2>
          <div className="mt-3 space-y-2">
            {analysis.emotions.slice(0, 6).map((emotion, index) => (
              <div key={`${emotion.name}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-start justify-between gap-3">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Emotion name</span>
                    <input
                      value={emotion.name}
                      onChange={(event) => updateEmotion(index, { name: event.target.value })}
                      className="w-full rounded-xl border border-transparent bg-transparent font-semibold text-stone-100 outline-none focus:border-[var(--gold-border-soft)] focus:bg-black/20"
                    />
                  </label>
                  <button type="button" onClick={() => removeEmotion(index)} className="text-xs text-stone-500">Remove</button>
                </div>
                <p className="mt-1 text-xs text-[var(--gold-muted)]">{emotion.intensity}/10 • {emotion.level}</p>
                <p className="mt-1 text-sm leading-5 text-stone-300">{emotion.explanation ?? emotion.evidence ?? "This emotion appeared in the tone or details of your reflection."}</p>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={emotion.intensity}
                  onChange={(event) => updateEmotion(index, { intensity: Number(event.target.value) })}
                  className="mt-2 w-full"
                  aria-label={`Adjust ${emotion.name} intensity`}
                />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-[var(--gold-light)]">Key incidents I identified</h2>
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
          <h2 className="font-serif text-xl text-[var(--gold-light)]">Related chakra themes</h2>
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
                    <p className="mt-1 text-xs text-[var(--gold-muted)]">{item.emotionalTheme ?? chakra.meaning}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">Why it may be involved</p>
                    <p className="mt-1 text-sm leading-5 text-stone-300">{item.reason}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">How your session will support it</p>
                    <p className="mt-1 text-sm leading-5 text-stone-300">{item.sessionSupport ?? `Your plan will use ${chakra.name} sound and reflection to support ${chakra.meaning.toLowerCase()}.`}</p>
                  </div>
                  <button type="button" onClick={() => removeChakra(item.chakra)} className="self-start text-xs text-stone-500">Remove</button>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-3.5">
          <h2 className="font-serif text-xl text-[var(--gold-light)]">How the healing plan will support you</h2>
          <p className="mt-2 text-sm leading-5 text-stone-300">{healingApproach}</p>
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

function InsightArtwork() {
  return (
    <div data-testid="emotional-insight-artwork" className="relative min-h-28 overflow-hidden rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-[radial-gradient(circle_at_50%_45%,rgba(178,89,231,0.32),transparent_34%),linear-gradient(135deg,rgba(255,217,135,0.08),rgba(8,10,24,0.94))]">
      <div className="pointer-events-none absolute inset-x-8 top-8 h-14 mvp-energy-wave opacity-60" />
      <div className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-black/28 shadow-[0_0_34px_rgba(178,89,231,0.36)]">
        <div className="absolute inset-3 rounded-full border border-white/10" />
        <div className="h-9 w-9 rotate-45 rounded-[0.7rem] border border-[var(--gold-light)] bg-purple-400/10" />
        <span className="absolute text-xl text-[var(--gold-light)]">☾</span>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,217,135,0.12),transparent_22%),radial-gradient(circle_at_72%_60%,rgba(67,185,238,0.1),transparent_24%)]" />
    </div>
  );
}

function buildFallbackApproach(chakras: string[]) {
  if (chakras.includes("root") && chakras.includes("throat")) {
    return "We will begin with grounding, then make space for clearer expression, and close by helping your body settle.";
  }
  return "Your plan will combine calming sound, breathwork and reflection around the chakra themes that appeared in your entry.";
}

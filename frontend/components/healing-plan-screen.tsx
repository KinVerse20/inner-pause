"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { AppPageHeader, ChakraBadge, ExpandableCard } from "@/components/chakra-path-ui";
import { GlassCard, GoldButton, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { defaultPlanCustomisation } from "@/lib/healing-engine";
import { keepReflectionTemporary, savePlan, saveReflectionToJourney, updateJournalEntry } from "@/lib/mvp-storage";
import { GuidanceFrequency, HealingPlanCustomisation, MusicStyle, NatureSound, VoiceGuidanceLevel } from "@/lib/mvp-types";
import { useMvpState } from "@/lib/use-mvp-state";

const durationOptions: Array<number | "full"> = [5, 10, 20, 30, "full"];
const voiceOptions: Array<{ value: VoiceGuidanceLevel; label: string }> = [
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "balanced", label: "Balanced" },
  { value: "guided", label: "Guided" },
];
const musicStyleOptions: Array<{ value: MusicStyle; label: string }> = [
  { value: "ambient", label: "Ambient" },
  { value: "singing-bowls", label: "Singing bowls" },
  { value: "nature-soundscape", label: "Nature soundscape" },
  { value: "deep-frequency", label: "Deep frequency" },
  { value: "soft-meditation", label: "Soft meditation" },
];
const natureOptions: Array<{ value: NatureSound; label: string; disabled?: boolean }> = [
  { value: "none", label: "None" },
  { value: "rain", label: "Rain", disabled: true },
  { value: "forest", label: "Forest", disabled: true },
  { value: "ocean", label: "Ocean", disabled: true },
  { value: "soft-wind", label: "Soft wind", disabled: true },
];
const frequencyOptions: Array<{ value: GuidanceFrequency; label: string }> = [
  { value: "opening-only", label: "Opening only" },
  { value: "occasional", label: "Occasional" },
  { value: "regular", label: "Regular" },
];

export function HealingPlanScreen() {
  const router = useRouter();
  const entryId = useSearchParams().get("entry");
  const state = useMvpState();
  const [adjusting, setAdjusting] = useState(false);
  const entry = useMemo(() => {
    if (entryId) return state.entries.find((item) => item.id === entryId);
    return state.entries.find((item) => item.plan) ?? state.entries.find((item) => item.analysis);
  }, [entryId, state.entries]);
  const plan = entry?.plan;

  if (!entry?.analysis) {
    return (
      <MvpShell>
        <GlassCard className="mx-auto max-w-xl p-5">
          <h1 className="font-serif text-2xl text-[var(--ip-ink)]">No personalised reset yet</h1>
          <p className="mt-2 text-sm text-[var(--ip-body)]">Share what you feel to create your first reset.</p>
          <Link href="/journal" className="mt-4 inline-flex rounded-full border border-[var(--ip-border)] bg-white px-5 py-3 text-[var(--ip-purple)]">Start Expressing</Link>
        </GlassCard>
      </MvpShell>
    );
  }

  if (!plan) {
    return (
      <MvpShell>
        <GlassCard className="mx-auto max-w-xl p-5">
          <h1 className="font-serif text-2xl text-[var(--ip-ink)]">Reset not ready yet</h1>
          <p className="mt-2 text-sm text-[var(--ip-body)]">Confirm your understanding to create a reset.</p>
          <GoldButton className="mt-4" onClick={() => { savePlan(entry.id); router.refresh(); }}>Create Reset</GoldButton>
        </GlassCard>
      </MvpShell>
    );
  }

  const settings: HealingPlanCustomisation = { ...defaultPlanCustomisation, ...(plan.customisation ?? {}), duration: plan.selectedDuration };
  const updateSettings = (updates: Partial<HealingPlanCustomisation>) => {
    const next = { ...settings, ...updates };
    savePlan(entry.id, next.duration, next);
  };

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <AppPageHeader title="Your Reset" copy="A personalised healing path." backHref="/analysis" />

        <GlassCard className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl text-[var(--ip-ink)]">Your personalised reset is ready</h1>
              <p className="mt-1 text-sm text-[var(--ip-body)]">Total time: {plan.totalDurationMinutes} min</p>
            </div>
            <span className="rounded-full bg-[var(--ip-lavender)] px-3 py-1 text-xs font-semibold text-[var(--ip-purple)]">{plan.blocks.length} steps</span>
          </div>
        </GlassCard>

        <div className="space-y-2">
          {plan.blocks.map((block, index) => {
            const chakra = chakraMap[block.chakraId];
            return (
              <div key={block.id} className="relative pl-8">
                {index < plan.blocks.length - 1 ? <span className="absolute left-[0.88rem] top-10 h-[calc(100%-1.25rem)] w-px bg-[var(--ip-border-strong)]" /> : null}
                <span className="absolute left-0 top-4 grid h-7 w-7 place-items-center rounded-full border bg-white text-xs font-semibold" style={{ borderColor: chakra.accent, color: chakra.color }}>{index + 1}</span>
                <GlassCard className="p-3">
                  <div className="flex items-center gap-3">
                    <ChakraBadge chakraId={block.chakraId} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-serif text-xl text-[var(--ip-ink)]">{block.title}</p>
                      <p className="line-clamp-1 text-sm text-[var(--ip-body)]">{block.intention}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--ip-ink)]">{block.durationMinutes} min</p>
                      <p className="text-xl text-[var(--ip-purple)]">▶</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>

        <GlassCard className="p-4">
          <h2 className="font-serif text-xl text-[var(--ip-ink)]">Would you like to remember this reflection?</h2>
          <p className="mt-1 text-sm text-[var(--ip-body)]">Saving the summary can help you notice patterns over time.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <GoldButton onClick={() => saveReflectionToJourney(entry.id)}>Save to My Journey</GoldButton>
            <button type="button" onClick={() => keepReflectionTemporary(entry.id)} className="min-h-11 rounded-full border border-[var(--ip-border)] bg-white px-4 font-semibold text-[var(--ip-purple)]">Not Now</button>
            <button
              type="button"
              onClick={() => {
                const next = window.prompt("Edit Reflection", entry.analysis?.understandingSummary ?? entry.analysis?.summary ?? entry.title);
                if (next?.trim() && entry.analysis) updateJournalEntry(entry.id, { analysis: { ...entry.analysis, understandingSummary: next.trim(), summary: next.trim() } });
              }}
              className="min-h-11 rounded-full border border-[var(--ip-border)] bg-white px-4 font-semibold text-[var(--ip-purple)]"
            >
              Edit Reflection
            </button>
          </div>
        </GlassCard>

        <button type="button" onClick={() => setAdjusting((value) => !value)} className="min-h-11 w-full rounded-full border border-[var(--ip-border)] bg-white font-semibold text-[var(--ip-purple)]">
          Adjust Session
        </button>

        {adjusting ? (
          <ExpandableCard title="Session settings" summary="Duration, voice, music and affirmations" defaultOpen>
            <div className="space-y-4">
              <ControlGroup label="Duration">
                {durationOptions.map((duration) => <ChipButton key={`${duration}`} selected={settings.duration === duration} onClick={() => updateSettings({ duration })}>{duration === "full" ? "Full recommended" : `${duration} min`}</ChipButton>)}
              </ControlGroup>
              <ControlGroup label="Voice level">
                {voiceOptions.map((option) => <ChipButton key={option.value} selected={settings.voiceGuidanceLevel === option.value} onClick={() => updateSettings({ voiceGuidanceLevel: option.value })}>{option.label}</ChipButton>)}
              </ControlGroup>
              <ControlGroup label="Music style">
                {musicStyleOptions.map((option) => <ChipButton key={option.value} selected={settings.musicStyle === option.value} onClick={() => updateSettings({ musicStyle: option.value })}>{option.label}</ChipButton>)}
              </ControlGroup>
              <ControlGroup label="Affirmations">
                <ChipButton selected={settings.affirmationsEnabled} onClick={() => updateSettings({ affirmationsEnabled: true })}>On</ChipButton>
                <ChipButton selected={!settings.affirmationsEnabled} onClick={() => updateSettings({ affirmationsEnabled: false })}>Off</ChipButton>
              </ControlGroup>
              <ControlGroup label="Guidance frequency">
                {frequencyOptions.map((option) => <ChipButton key={option.value} selected={settings.guidanceFrequency === option.value} onClick={() => updateSettings({ guidanceFrequency: option.value })}>{option.label}</ChipButton>)}
              </ControlGroup>
              <ControlGroup label="Nature sound">
                {natureOptions.map((option) => <ChipButton key={option.value} selected={settings.natureSound === option.value} disabled={option.disabled} onClick={() => updateSettings({ natureSound: option.value })}>{option.label}{option.disabled ? " · Soon" : ""}</ChipButton>)}
              </ControlGroup>
            </div>
          </ExpandableCard>
        ) : null}

        <GoldButton className="w-full" onClick={() => router.push(`/healing/player?plan=${plan.id}`)}>
          Start Reset
        </GoldButton>
      </div>
    </MvpShell>
  );
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--ip-muted)]">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ChipButton({ selected, disabled = false, onClick, children }: { selected: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`min-h-10 rounded-full border px-3 py-1.5 text-sm disabled:opacity-45 ${selected ? "border-[var(--ip-purple)] bg-[var(--ip-lavender)] text-[var(--ip-purple)]" : "border-[var(--ip-border)] bg-white text-[var(--ip-body)]"}`}>
      {children}
    </button>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { ChakraGlyph } from "@/components/chakra-symbol";
import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { defaultPlanCustomisation } from "@/lib/healing-engine";
import { savePlan } from "@/lib/mvp-storage";
import { HealingPlanCustomisation, GuidanceFrequency, MusicStyle, NatureSound, VoiceGuidanceLevel } from "@/lib/mvp-types";
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
  const entry = useMemo(() => {
    if (entryId) return state.entries.find((item) => item.id === entryId);
    return state.entries.find((item) => item.plan) ?? state.entries.find((item) => item.analysis);
  }, [entryId, state.entries]);
  const plan = entry?.plan;

  if (!entry?.analysis) {
    return (
      <MvpShell>
        <GlassCard className="mx-auto max-w-xl p-6">
          <h1 className="font-serif text-3xl text-[var(--gold-light)]">No healing plan yet</h1>
          <p className="mt-3 text-sm leading-6 text-stone-300">Create a journal entry and emotional insight to generate your first personalised plan.</p>
          <Link href="/journal" className="mt-5 inline-flex rounded-full border border-[var(--gold-border)] px-5 py-3 text-[var(--gold-light)]">Start Journal</Link>
        </GlassCard>
      </MvpShell>
    );
  }

  if (!plan) {
    return (
      <MvpShell>
        <GlassCard className="mx-auto max-w-xl p-6">
          <h1 className="font-serif text-3xl text-[var(--gold-light)]">Plan not created yet</h1>
          <p className="mt-3 text-sm leading-6 text-stone-300">Confirm the insight to create your personalised healing plan.</p>
          <GoldButton className="mt-5" onClick={() => { savePlan(entry.id); router.refresh(); }}>Create Healing Plan</GoldButton>
        </GlassCard>
      </MvpShell>
    );
  }

  const regenerate = (duration: number | "full") => {
    savePlan(entry.id, duration, { ...(plan.customisation ?? defaultPlanCustomisation), duration });
  };

  const settings: HealingPlanCustomisation = { ...defaultPlanCustomisation, ...(plan.customisation ?? {}), duration: plan.selectedDuration };

  const updateSettings = (updates: Partial<HealingPlanCustomisation>) => {
    const next = { ...settings, ...updates };
    savePlan(entry.id, next.duration, next);
  };

  return (
    <MvpShell>
      <div className="mx-auto max-w-3xl space-y-3.5">
        <header className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04]" aria-label="Back">←</button>
          <div className="text-center">
            <p className="text-sm text-[var(--gold-muted)]">Your Healing Plan</p>
            <p className="text-xs text-stone-500">Personalised just for you</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04]">✧</span>
        </header>

        <div className="relative grid min-h-24 place-items-center overflow-hidden rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-white/[0.04]">
          <div className="absolute inset-x-0 top-8 h-14 mvp-energy-wave" />
          <div className="mvp-meditator scale-50" />
        </div>

        <SectionTitle title={plan.title} copy={plan.intendedOutcome} />

        <GlassCard className="p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--gold-muted)]">Total Duration</p>
            <p className="font-serif text-2xl text-[var(--gold-light)]">{plan.totalDurationMinutes} min</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {durationOptions.map((duration) => (
              <button
                key={`${duration}`}
                type="button"
                onClick={() => regenerate(duration)}
                className={`min-h-10 rounded-full border px-3 py-1.5 text-sm ${plan.selectedDuration === duration ? "border-[var(--gold-border)] bg-amber-300/10 text-[var(--gold-light)]" : "border-white/10 bg-white/[0.04] text-stone-300"}`}
              >
                {duration === "full" ? "Full recommended" : `${duration} min`}
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-2">
          {plan.blocks.map((block, index) => {
            const chakra = chakraMap[block.chakraId];
            return (
              <div key={block.id} className="relative pl-7">
                <div className="absolute bottom-[-0.5rem] left-[0.72rem] top-8 w-px bg-[var(--gold-border-soft)]" />
                <span className="absolute left-0 top-3 grid h-6 w-6 place-items-center rounded-full border border-[var(--gold-border)] bg-[#030711] text-xs text-[var(--gold-light)]">{index + 1}</span>
                <GlassCard className="p-3" style={{ boxShadow: `0 0 28px ${chakra.glow}` }}>
                  <div className="flex gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: chakra.accent, color: chakra.accent }}>
                      <ChakraGlyph chakraId={chakra.id} className="h-7 w-7" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="line-clamp-1 font-serif text-xl text-stone-100">{block.title}</h2>
                        <p className="shrink-0 text-xs text-stone-500">{block.durationMinutes}m</p>
                      </div>
                      <p className="mt-1 text-xs text-[var(--gold-muted)]">{chakra.name} • {block.frequencyLabel}</p>
                      <p className="mt-1 line-clamp-1 text-sm leading-5 text-stone-300">{block.intention}</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>

        <GlassCard className="p-3.5">
          <p className="font-serif text-xl text-[var(--gold-light)]">Your session</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-300 sm:grid-cols-5">
            <SummaryChip label={`${plan.totalDurationMinutes} minutes`} />
            <SummaryChip label={settings.voiceGuidanceLevel === "none" ? "no voice guidance" : `${labelFor(settings.voiceGuidanceLevel, voiceOptions)} guidance`} />
            <SummaryChip label={labelFor(settings.musicStyle, musicStyleOptions)} />
            <SummaryChip label={`Affirmations ${settings.affirmationsEnabled ? "on" : "off"}`} />
            <SummaryChip label={settings.natureSound === "none" ? "No nature sounds" : labelFor(settings.natureSound, natureOptions)} />
          </div>
          <p className="mt-3 text-xs leading-5 text-stone-500">
            Music style is saved in the session summary. Extra nature layers are coming soon and are disabled until local assets exist.
          </p>
        </GlassCard>

        <details className="rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-[var(--background-card)] p-3.5">
          <summary className="cursor-pointer font-serif text-xl text-[var(--gold-light)]">Customisation</summary>
          <div className="mt-4 space-y-4">
            <ControlGroup label="Duration">
              {durationOptions.map((duration) => (
                <ChipButton
                  key={`${duration}`}
                  selected={settings.duration === duration}
                  onClick={() => updateSettings({ duration })}
                >
                  {duration === "full" ? "Full recommended" : `${duration} min`}
                </ChipButton>
              ))}
            </ControlGroup>

            <ControlGroup label="Voice guidance level">
              {voiceOptions.map((option) => (
                <ChipButton key={option.value} selected={settings.voiceGuidanceLevel === option.value} onClick={() => updateSettings({ voiceGuidanceLevel: option.value })}>
                  {option.label}
                </ChipButton>
              ))}
            </ControlGroup>

            <ControlGroup label="Music style">
              {musicStyleOptions.map((option) => (
                <ChipButton key={option.value} selected={settings.musicStyle === option.value} onClick={() => updateSettings({ musicStyle: option.value })}>
                  {option.label}
                </ChipButton>
              ))}
            </ControlGroup>

            <ControlGroup label="Affirmations">
              <ChipButton selected={settings.affirmationsEnabled} onClick={() => updateSettings({ affirmationsEnabled: true })}>On</ChipButton>
              <ChipButton selected={!settings.affirmationsEnabled} onClick={() => updateSettings({ affirmationsEnabled: false })}>Off</ChipButton>
            </ControlGroup>

            <ControlGroup label="Nature sounds">
              {natureOptions.map((option) => (
                <ChipButton key={option.value} selected={settings.natureSound === option.value} disabled={option.disabled} onClick={() => updateSettings({ natureSound: option.value })}>
                  {option.label}{option.disabled ? " · Coming soon" : ""}
                </ChipButton>
              ))}
            </ControlGroup>

            <ControlGroup label="Guidance frequency">
              {frequencyOptions.map((option) => (
                <ChipButton key={option.value} selected={settings.guidanceFrequency === option.value} onClick={() => updateSettings({ guidanceFrequency: option.value })}>
                  {option.label}
                </ChipButton>
              ))}
            </ControlGroup>
          </div>
        </details>

        <GoldButton className="w-full" onClick={() => router.push(`/healing/player?plan=${plan.id}`)}>
          Start Healing
        </GoldButton>
      </div>
    </MvpShell>
  );
}

function labelFor<T extends string>(value: T, options: Array<{ value: T; label: string }>) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function SummaryChip({ label }: { label: string }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-center">{label}</span>;
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--gold-muted)]">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ChipButton({ selected, disabled = false, onClick, children }: { selected: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-10 rounded-full border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${
        selected ? "border-[var(--gold-border)] bg-amber-300/10 text-[var(--gold-light)]" : "border-white/10 bg-white/[0.04] text-stone-300 hover:border-[var(--gold-border-soft)]"
      }`}
    >
      {children}
    </button>
  );
}

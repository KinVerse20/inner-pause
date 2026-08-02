"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { saveFeedback } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

export function SessionFeedbackScreen() {
  const router = useRouter();
  const planId = useSearchParams().get("plan");
  const state = useMvpState();
  const entry = state.entries.find((item) => item.plan?.id === planId);
  const plan = entry?.plan;
  const [emotionalAfter, setEmotionalAfter] = useState(Math.max(1, (entry?.emotionalIntensityBefore ?? 6) - 2));
  const [bodyTension, setBodyTension] = useState(4);
  const [mentalCalmness, setMentalCalmness] = useState(7);
  const [helpfulSection, setHelpfulSection] = useState(plan?.blocks[0]?.title ?? "");
  const [wouldRepeat, setWouldRepeat] = useState(true);
  const [reflection, setReflection] = useState("");
  const [uncomfortable, setUncomfortable] = useState("");
  const [saving, setSaving] = useState(false);

  if (!entry || !plan) {
    return (
      <MvpShell hideNav>
        <GlassCard className="mx-auto max-w-xl p-6">No session found.</GlassCard>
      </MvpShell>
    );
  }

  const before = entry.emotionalIntensityBefore;

  const submit = () => {
    if (saving) return;
    setSaving(true);
    saveFeedback(plan.id, {
      emotionalIntensityAfter: emotionalAfter,
      bodyTensionAfter: bodyTension,
      mentalCalmnessAfter: mentalCalmness,
      helpfulSection,
      uncomfortable,
      wouldRepeat,
      reflection,
      createdAt: new Date().toISOString(),
    });
    router.push("/");
  };

  return (
    <MvpShell hideNav>
      <div className="mx-auto max-w-2xl space-y-3.5">
        <SectionTitle title="How do you feel now?" copy="Save what changed after this session." />

        <GlassCard className="p-3.5">
          <h2 className="font-serif text-xl text-[var(--gold-light)]">Before and after</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs text-stone-400">Before</p>
              <p className="mt-1 font-serif text-3xl text-stone-100">{before}/10</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs text-stone-400">After</p>
              <p className="mt-1 font-serif text-3xl text-[var(--gold-light)]">{emotionalAfter}/10</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-stone-300">
            {emotionalAfter < before ? "You reported feeling calmer after this session." : "Your response has been saved without assuming a guaranteed result."}
          </p>
        </GlassCard>

        <GlassCard className="space-y-3 p-3.5">
          {[
            { label: "Emotional intensity", value: emotionalAfter, set: setEmotionalAfter },
            { label: "Body tension", value: bodyTension, set: setBodyTension },
            { label: "Mental calmness", value: mentalCalmness, set: setMentalCalmness },
          ].map((item) => (
            <label key={item.label} className="block">
              <span className="flex justify-between text-sm font-semibold text-stone-100">
                <span>{item.label}</span>
                <span className="text-stone-400">{item.value}/10</span>
              </span>
              <input type="range" min={1} max={10} value={item.value} onChange={(event) => item.set(Number(event.target.value))} className="mt-2 w-full" />
            </label>
          ))}
        </GlassCard>

        <GlassCard className="p-3.5">
          <label className="text-sm font-semibold text-stone-100">Which section helped most?</label>
          <select value={helpfulSection} onChange={(event) => setHelpfulSection(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100">
            {plan.blocks.map((block) => <option key={block.id}>{block.title}</option>)}
          </select>
          <details className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--gold-light)]">Optional notes</summary>
            <label className="mt-3 block text-sm font-semibold text-stone-100">Anything uncomfortable?</label>
            <input value={uncomfortable} onChange={(event) => setUncomfortable(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" placeholder="Optional" />
            <label className="mt-3 block text-sm font-semibold text-stone-100">Reflection</label>
            <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} className="mt-2 min-h-20 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" placeholder="What did you notice?" />
          </details>
          <label className="mt-3 flex items-center gap-3 text-sm text-stone-300">
            <input type="checkbox" checked={wouldRepeat} onChange={(event) => setWouldRepeat(event.target.checked)} />
            I would use this session again
          </label>
        </GlassCard>

        <div className="grid gap-2 sm:grid-cols-2">
          <GoldButton disabled={saving} onClick={submit}>{saving ? "Saving..." : "Save Session"}</GoldButton>
          <button type="button" disabled={saving} onClick={() => router.push("/")} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] text-[var(--gold-light)] disabled:opacity-45">Return Home</button>
        </div>
      </div>
    </MvpShell>
  );
}

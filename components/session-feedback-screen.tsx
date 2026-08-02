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

  if (!entry || !plan) {
    return (
      <MvpShell hideNav>
        <GlassCard className="mx-auto max-w-xl p-6">No session found.</GlassCard>
      </MvpShell>
    );
  }

  const before = entry.emotionalIntensityBefore;

  const submit = () => {
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
    router.push("/premium");
  };

  return (
    <MvpShell hideNav>
      <div className="mx-auto max-w-2xl space-y-5">
        <SectionTitle title="How do you feel now?" copy="Record what changed after the session. This helps the app learn what supports you over time." />

        <GlassCard className="p-5">
          <h2 className="font-serif text-2xl text-[var(--gold-light)]">Before and after</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-stone-400">Emotional intensity before</p>
              <p className="mt-2 font-serif text-4xl text-stone-100">{before}/10</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-stone-400">Emotional intensity after</p>
              <p className="mt-2 font-serif text-4xl text-[var(--gold-light)]">{emotionalAfter}/10</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-stone-300">
            {emotionalAfter < before ? "You reported feeling calmer after this session." : "Your response has been saved without assuming a guaranteed result."}
          </p>
        </GlassCard>

        {[
          { label: "Emotional intensity after session", value: emotionalAfter, set: setEmotionalAfter },
          { label: "Body tension after session", value: bodyTension, set: setBodyTension },
          { label: "Mental calmness", value: mentalCalmness, set: setMentalCalmness },
        ].map((item) => (
          <GlassCard key={item.label} className="p-5">
            <label className="text-sm font-semibold text-stone-100">{item.label}</label>
            <input type="range" min={1} max={10} value={item.value} onChange={(event) => item.set(Number(event.target.value))} className="mt-4 w-full" />
            <p className="mt-2 text-sm text-stone-400">{item.value}/10</p>
          </GlassCard>
        ))}

        <GlassCard className="p-5">
          <label className="text-sm font-semibold text-stone-100">Which section helped most?</label>
          <select value={helpfulSection} onChange={(event) => setHelpfulSection(event.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100">
            {plan.blocks.map((block) => <option key={block.id}>{block.title}</option>)}
          </select>
          <label className="mt-5 block text-sm font-semibold text-stone-100">Did anything feel uncomfortable?</label>
          <input value={uncomfortable} onChange={(event) => setUncomfortable(event.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" placeholder="Optional" />
          <label className="mt-5 block text-sm font-semibold text-stone-100">Add Reflection</label>
          <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} className="mt-3 min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" placeholder="What did you notice?" />
          <label className="mt-4 flex items-center gap-3 text-sm text-stone-300">
            <input type="checkbox" checked={wouldRepeat} onChange={(event) => setWouldRepeat(event.target.checked)} />
            I would use this session again
          </label>
        </GlassCard>

        <div className="grid gap-3 sm:grid-cols-2">
          <GoldButton onClick={submit}>Save Session</GoldButton>
          <button type="button" onClick={() => router.push("/")} className="min-h-12 rounded-full border border-[var(--gold-border-soft)] text-[var(--gold-light)]">Return Home</button>
        </div>
      </div>
    </MvpShell>
  );
}

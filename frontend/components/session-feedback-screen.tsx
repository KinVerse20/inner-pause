"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { saveFeedback } from "@/lib/mvp-storage";
import { pauseCategories } from "@/lib/pause-categories";
import { useMvpState } from "@/lib/use-mvp-state";

const quickMoods = [
  { emoji: "😌", label: "Much calmer" },
  { emoji: "🙂", label: "A little calmer" },
  { emoji: "😐", label: "About the same" },
  { emoji: "😕", label: "More unsettled" },
];

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
  const [feelingNow, setFeelingNow] = useState("A little calmer");
  const [saving, setSaving] = useState(false);
  const [quickNote, setQuickNote] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);

  if (!entry || !plan) {
    return (
      <MvpShell hideNav>
        <GlassCard className="mx-auto max-w-xl p-6">No session found.</GlassCard>
      </MvpShell>
    );
  }

  const before = entry.emotionalIntensityBefore;
  const isQuickPause = entry.saveMode === "reset_only";
  const currentCategory = pauseCategories.find((category) => category.chakraId === plan.blocks[0]?.chakraId);
  const suggestedCategory = pauseCategories.find((category) => category.id !== currentCategory?.id) ?? pauseCategories[0];

  const submitQuickPause = () => {
    if (saving) return;
    setSaving(true);
    saveFeedback(plan.id, {
      emotionalIntensityAfter: Math.max(1, before - 2),
      bodyTensionAfter: 4,
      mentalCalmnessAfter: 7,
      helpfulSection: plan.blocks[0]?.title ?? "",
      wouldRepeat: true,
      reflection: quickNote ? `${feelingNow}: ${quickNote}` : feelingNow,
      createdAt: new Date().toISOString(),
    });
    setSaving(false);
    setCheckedIn(true);
  };

  if (isQuickPause && !checkedIn) {
    return (
      <MvpShell hideNav>
        <div className="mx-auto max-w-xl space-y-3.5">
          <SectionTitle title="How do you feel now?" />

          <GlassCard tone={currentCategory?.tone} className="p-4">
            <div className="grid grid-cols-4 gap-2">
              {quickMoods.map((mood) => (
                <button
                  key={mood.label}
                  type="button"
                  onClick={() => setFeelingNow(mood.label)}
                  aria-label={mood.label}
                  className={`grid min-h-14 place-items-center rounded-2xl border text-2xl ${feelingNow === mood.label ? "border-purple-300 bg-purple-100" : "border-[var(--ip-border)] bg-white/70"}`}
                >
                  {mood.emoji}
                </button>
              ))}
            </div>
            <textarea
              value={quickNote}
              onChange={(event) => setQuickNote(event.target.value)}
              placeholder="Add a note (optional)"
              className="mt-3 min-h-16 w-full rounded-2xl border border-[var(--ip-border)] bg-white/70 p-3 text-sm text-[var(--ip-ink)] placeholder:text-[var(--ip-muted)]"
            />
          </GlassCard>

          <GoldButton className="w-full" disabled={saving} onClick={submitQuickPause}>
            {saving ? "Saving..." : "Done"}
          </GoldButton>
        </div>
      </MvpShell>
    );
  }

  if (isQuickPause && checkedIn) {
    return (
      <MvpShell hideNav>
        <div className="mx-auto max-w-xl space-y-3.5 text-center">
          <SectionTitle title="Great job! 🎉" copy="Would you like to continue your practice?" />

          <GlassCard tone={suggestedCategory.tone} className="p-4 text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ip-muted)]">Practice {suggestedCategory.label}</p>
            <p className="mt-1 font-serif text-lg text-[var(--ip-ink)]">{suggestedCategory.tagline}</p>
            <button
              type="button"
              onClick={() => router.push(`/pause/${suggestedCategory.id}`)}
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full border border-purple-400/30 bg-[linear-gradient(135deg,var(--ip-purple-2),var(--ip-purple))] px-4 py-2.5 font-semibold text-white"
            >
              Continue
            </button>
          </GlassCard>

          <button type="button" onClick={() => router.push("/")} className="min-h-11 w-full rounded-full border border-[var(--ip-border)] text-[var(--ip-ink)]">
            Return Home
          </button>
        </div>
      </MvpShell>
    );
  }

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
      reflection: reflection ? `${feelingNow}: ${reflection}` : feelingNow,
      createdAt: new Date().toISOString(),
    });
    router.push("/");
  };

  return (
    <MvpShell>
      <div className="mx-auto max-w-2xl space-y-3.5">
        <SectionTitle title="How do you feel now?" copy="Notice what changed after this reset." />

        <GlassCard className="p-3.5">
          <div className="grid grid-cols-2 gap-2">
            {["Much calmer", "A little calmer", "About the same", "More unsettled"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFeelingNow(option)}
                className={`min-h-12 rounded-2xl border px-3 text-sm font-medium ${feelingNow === option ? "border-purple-300 bg-purple-100 text-[#6d28d9]" : "border-purple-100 bg-white/70 text-[#4b3f86]"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-3.5">
          <h2 className="font-serif text-xl text-[#130b4f]">Before and after</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-purple-100 bg-white/70 p-3">
              <p className="text-xs text-[#6d5ea8]">Before</p>
              <p className="mt-1 font-serif text-3xl text-[#130b4f]">{before}/10</p>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-white/70 p-3">
              <p className="text-xs text-[#6d5ea8]">Now</p>
              <p className="mt-1 font-serif text-3xl text-[#6d28d9]">{emotionalAfter}/10</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-[#4b3f86]">
            {emotionalAfter < before ? "Your check-in suggests this session helped you feel slightly calmer." : "Your check-in has been saved without assuming a guaranteed result."}
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

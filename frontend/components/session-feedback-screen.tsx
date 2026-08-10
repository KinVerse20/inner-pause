"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { MvpShell } from "@/components/mvp-shell";
import { BeforeAfterShift, RitualBackdrop, RitualWeatherCard, inferWeatherTone } from "@/components/inner-world-ritual-ui";
import { CompletionBloom } from "@/components/ritual-motion-visuals";
import { saveFeedback } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

const feelingOptions = ["Lighter", "Calmer", "More clear", "Still processing"] as const;

export function SessionFeedbackScreen() {
  const router = useRouter();
  const planId = useSearchParams().get("plan");
  const state = useMvpState();
  const entry = state.entries.find((item) => item.plan?.id === planId);
  const plan = entry?.plan;
  const [feelingNow, setFeelingNow] = useState<(typeof feelingOptions)[number]>("Calmer");
  const [saving, setSaving] = useState(false);

  const beforeLine = useMemo(() => {
    const firstEmotion = entry?.analysis?.emotions[0]?.name?.toLowerCase();
    if (firstEmotion?.includes("confus")) return "You entered feeling scattered.";
    if (firstEmotion?.includes("stress") || firstEmotion?.includes("anx")) return "You entered braced and overloaded.";
    if (firstEmotion?.includes("sad")) return "You entered carrying heaviness.";
    return "You entered holding a lot.";
  }, [entry?.analysis?.emotions]);

  const afterLine =
    feelingNow === "Lighter"
      ? "You are leaving a little lighter."
      : feelingNow === "Calmer"
        ? "You are leaving more grounded."
        : feelingNow === "More clear"
          ? "You are leaving with more clarity."
          : "You are leaving with space to keep processing.";

  if (!entry || !plan) {
    return (
      <MvpShell hideNav>
        <div className="mx-auto max-w-xl rounded-[1.45rem] border border-white/10 bg-[rgba(17,18,20,0.66)] p-6">No session found.</div>
      </MvpShell>
    );
  }

  const tone = inferWeatherTone(`${entry.analysis?.summary ?? ""} ${feelingNow}`);

  const submit = () => {
    if (saving) return;
    setSaving(true);
    saveFeedback(plan.id, {
      emotionalIntensityAfter: feelingNow === "Still processing" ? 6 : feelingNow === "More clear" ? 4 : 3,
      bodyTensionAfter: feelingNow === "Still processing" ? 5 : 3,
      mentalCalmnessAfter: feelingNow === "More clear" ? 8 : feelingNow === "Still processing" ? 5 : 7,
      helpfulSection: plan.blocks[0]?.title ?? "Healing",
      wouldRepeat: true,
      reflection: `${beforeLine} ${afterLine}`,
      createdAt: new Date().toISOString(),
    });
    router.push("/insights");
  };

  const intention = createTomorrowIntention(entry.analysis?.triggers[0], entry.analysis?.emotions[0]?.name);

  return (
    <MvpShell hideNav>
      <div className="space-y-5">
        <RitualBackdrop tone={tone} className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="relative z-10 space-y-5">
            <CompletionBloom />
            <div className="completion-content-reveal space-y-2 text-center">
              <p className="minimal-label text-xs">Close</p>
              <h1 className="font-serif text-[clamp(2.5rem,7vw,4.6rem)] leading-[0.95] text-[var(--gold-light)]">
                Session complete.
              </h1>
              <p className="text-base leading-7 text-[var(--ip-body)]">You&apos;ve taken a mindful pause. Take a moment to notice the shift.</p>
            </div>

            <div className="completion-content-reveal"><BeforeAfterShift before={beforeLine} after={afterLine} /></div>

            <div className="grid gap-3 sm:grid-cols-2">
              <RitualWeatherCard title="Before" line={beforeLine} tone={inferWeatherTone(entry.analysis?.summary)} />
              <RitualWeatherCard title="After" line={afterLine} tone={tone} />
            </div>

            <div className="completion-content-reveal rounded-[1.45rem] border border-white/10 bg-[rgba(17,18,20,0.5)] p-4 sm:p-5">
              <p className="minimal-label text-[0.62rem]">How are you feeling right now?</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {feelingOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFeelingNow(option)}
                    className={`min-h-12 rounded-full border px-4 text-sm font-semibold uppercase tracking-[0.16em] ${
                      feelingNow === option
                        ? "border-[rgba(244,122,34,0.55)] bg-[rgba(244,122,34,0.12)] text-[var(--gold-light)]"
                        : "border-white/10 bg-white/[0.035] text-[var(--ip-body)]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </RitualBackdrop>

        <RitualBackdrop tone={tone} className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="relative z-10 space-y-5">
            <p className="minimal-label text-xs">Carry forward</p>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
              <div className="rounded-[1.45rem] border border-white/10 bg-[rgba(17,18,20,0.56)] p-4 sm:p-5">
                <h2 className="font-serif text-3xl text-[var(--ip-ink)]">One gentle intention for tomorrow.</h2>
                <p className="mt-3 text-base leading-7 text-[var(--ip-body)]">
                  {entry.analysis?.triggers[0]
                    ? `Yesterday, ${entry.analysis.triggers[0].toLowerCase()} stood out. Did today feel any different?`
                    : "Yesterday left a trace. Notice if tomorrow asks for something softer."}
                </p>
                <p className="mt-4 font-serif text-[1.55rem] leading-8 text-[var(--gold-light)]">{intention}</p>
              </div>

              <div className="space-y-3">
                <RitualWeatherCard title="Yesterday to today" line={entry.analysis?.understandingSummary ?? entry.analysis?.summary ?? "You stayed with your inner weather long enough to hear it."} tone={tone} />
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className="min-h-12 w-full rounded-full border border-[rgba(244,122,34,0.55)] bg-[rgba(244,122,34,0.12)] px-6 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold-light)] disabled:opacity-45"
                >
                  {saving ? "Carrying..." : "Carry it forward"}
                </button>
              </div>
            </div>
          </div>
        </RitualBackdrop>
      </div>
    </MvpShell>
  );
}

function createTomorrowIntention(trigger?: string, emotion?: string) {
  if (trigger?.toLowerCase().includes("confidence")) return "Tomorrow, I will pause before I shrink.";
  if (trigger?.toLowerCase().includes("pressure")) return "Tomorrow, I will breathe before I react.";
  if (emotion?.toLowerCase().includes("sad")) return "Tomorrow, I will leave room for what is tender.";
  if (emotion?.toLowerCase().includes("anx")) return "Tomorrow, I will come back to one steady breath.";
  return "Tomorrow, I will move more gently with myself.";
}

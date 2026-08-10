"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { MvpShell } from "@/components/mvp-shell";
import {
  RitualBackdrop,
  RitualWeatherCard,
  TransformStream,
  WitnessConstellation,
  inferWeatherTone,
} from "@/components/inner-world-ritual-ui";
import { ChakraResultsReveal } from "@/components/ritual-motion-visuals";
import { chakraMap } from "@/data/chakras";
import { savePlan, updateJournalEntry } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

export function AnalysisScreen() {
  const router = useRouter();
  const entryId = useSearchParams().get("entry");
  const state = useMvpState();
  const entry = state.entries.find((item) => item.id === entryId);
  const analysis = entry?.analysis;

  if (!entry || !analysis) {
    return (
      <MvpShell>
        <div className="mx-auto max-w-xl rounded-[1.45rem] border border-white/10 bg-[rgba(17,18,20,0.66)] p-5">
          <p className="text-[var(--ip-body)]">No emotional insight found. Share what you feel first.</p>
          <button
            type="button"
            onClick={() => router.replace("/journal")}
            className="mt-4 min-h-11 rounded-full border border-[rgba(244,122,34,0.45)] bg-[rgba(244,122,34,0.1)] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold-light)]"
          >
            Start expressing
          </button>
        </div>
      </MvpShell>
    );
  }

  const tone = inferWeatherTone(
    `${analysis.emotions.map((item) => item.name).join(" ")} ${analysis.triggers.join(" ")} ${analysis.summary}`,
  );
  const primaryEmotion = analysis.emotions[0]?.name ?? "Reflective";
  const primaryChakra = analysis.chakraAssociations[0];
  const secondaryChakra = analysis.chakraAssociations[1];
  const witnessLine = createWitnessLine(analysis.summary, analysis.triggers[0], primaryEmotion);
  const transformLine = analysis.healingApproachSummary ?? "Your difficult material is being gathered into a gentler sequence.";

  const beginHealing = () => {
    savePlan(entry.id);
    router.push(`/healing?entry=${entry.id}`);
  };

  return (
    <MvpShell>
      <div className="space-y-5">
        <RitualBackdrop tone={tone} className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="relative z-10 space-y-5">
            <div className="space-y-2 text-center">
              <p className="minimal-label text-xs">Witness</p>
              <h1 className="font-serif text-[clamp(2.8rem,8vw,4.8rem)] leading-[0.92] text-[var(--gold-light)]">
                Here&apos;s what we noticed.
              </h1>
              <p className="text-base leading-7 text-[var(--ip-body)]">Your reflection becomes visible.</p>
            </div>

            <WitnessConstellation emotions={analysis.emotions} />

            <div className="mx-auto max-w-4xl rounded-[1.4rem] border border-white/10 bg-[rgba(17,18,20,0.5)] p-4 text-center sm:p-5">
              <p className="font-serif text-[1.4rem] leading-8 text-[var(--ip-ink)]">{witnessLine}</p>
            </div>

            <div className="mx-auto text-center">
              <button
                type="button"
                onClick={() =>
                  updateJournalEntry(entry.id, {
                    analysis: {
                      ...analysis,
                      understandingSummary: analysis.understandingSummary ?? analysis.summary,
                    },
                  })
                }
                className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold-light)]"
              >
                Let us turn this into something lighter.
              </button>
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
              {analysis.emotions.slice(0, 4).map((emotion) => (
                <RitualWeatherCard
                  key={emotion.name}
                  title={emotion.name}
                  line={emotion.explanation ?? `Intensity ${emotion.intensity}/10`}
                  tone={inferWeatherTone(emotion.name)}
                />
              ))}
            </div>

            <div className="pt-2 text-center">
              <p className="minimal-label text-xs">Your chakra balance</p>
              <p className="mt-2 text-sm text-[var(--ip-body)]">
                {analysis.chakraAssociations.length} {analysis.chakraAssociations.length === 1 ? "chakra is" : "chakras are"} asking for gentle attention.
              </p>
            </div>
            <ChakraResultsReveal chakraIds={analysis.chakraAssociations.map((item) => item.chakra)} />
          </div>
        </RitualBackdrop>

        <RitualBackdrop tone={tone} className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="relative z-10 space-y-5">
            <div className="space-y-2 text-center">
              <p className="minimal-label text-xs">Transform</p>
              <h2 className="font-serif text-[clamp(2.4rem,7vw,4.3rem)] leading-[0.95] text-[var(--gold-light)]">
                Let us turn this into something lighter.
              </h2>
              <p className="text-base leading-7 text-[var(--ip-body)]">
                Your personalised healing journey is taking shape.
              </p>
            </div>

            <TransformStream labels={analysis.emotions.map((emotion) => emotion.name)} />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
              <div className="rounded-[1.4rem] border border-white/10 bg-[rgba(17,18,20,0.56)] p-4 sm:p-5">
                <p className="text-sm leading-7 text-[var(--ip-body)]">{transformLine}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--ip-body)]">
                  Suggested outcome: {analysis.suggestedOutcome}
                </p>
              </div>

              <div className="grid gap-3">
                <RitualWeatherCard
                  title="Dominant current"
                  line={primaryChakra ? `${chakraMap[primaryChakra.chakra].name} is carrying most of the charge.` : `${primaryEmotion} is the strongest signal right now.`}
                  tone={tone}
                />
                <RitualWeatherCard
                  title="Secondary thread"
                  line={secondaryChakra ? `${chakraMap[secondaryChakra.chakra].name} is close behind.` : "A quieter second layer is also present."}
                  tone={tone}
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={beginHealing}
                disabled={analysis.safetyFlag}
                className="min-h-12 rounded-full border border-[rgba(244,122,34,0.55)] bg-[rgba(244,122,34,0.12)] px-6 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold-light)] disabled:opacity-45"
              >
                Begin healing
              </button>
              <button
                type="button"
                onClick={() => router.push("/journey")}
                className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] px-6 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]"
              >
                View topology
              </button>
            </div>
          </div>
        </RitualBackdrop>
      </div>
    </MvpShell>
  );
}

function createWitnessLine(summary: string, trigger: string | undefined, emotion: string) {
  const lower = summary.toLowerCase();
  if (/(tired|exhausted|drained)/.test(lower)) {
    return "You were not only tired today — you were tired of having to stay strong.";
  }
  if (/(anxious|pressure|worry)/.test(lower) || trigger?.toLowerCase().includes("pressure")) {
    return "There is a strain here that feels older than this one moment alone.";
  }
  if (/(sad|grief|lonely)/.test(lower)) {
    return "This feels like sadness that has been holding itself together for too long.";
  }
  return `This is not only ${emotion.toLowerCase()} — it is the story underneath it asking to be witnessed.`;
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MvpShell } from "@/components/mvp-shell";
import { RitualBackdrop, inferWeatherTone } from "@/components/inner-world-ritual-ui";
import { ChakraResultsReveal } from "@/components/ritual-motion-visuals";
import { chakraMap } from "@/data/chakras";
import { savePlan } from "@/lib/mvp-storage";
import type { EmotionalAnalysis } from "@/lib/mvp-types";
import { useMvpState } from "@/lib/use-mvp-state";

export function AnalysisScreen() {
  const router = useRouter();
  const entryId = useSearchParams().get("entry");
  const state = useMvpState();
  const [detailsOpen, setDetailsOpen] = useState(false);
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
  const chakraIds = analysis.chakraAssociations.map((item) => item.chakra);
  const summary = createConciseSummary(analysis);

  const beginHealing = () => {
    const plan = entry.plan ?? savePlan(entry.id);
    if (!plan) return;
    router.push(`/healing/player?plan=${plan.id}`);
  };

  return (
    <MvpShell>
      <RitualBackdrop tone={tone} className="analysis-summary-screen">
        <div className="analysis-summary-layout">
          <header className="analysis-summary-heading ritual-content-enter">
            <p className="minimal-label">Your reflection</p>
            <h1>Here&apos;s what we noticed</h1>
          </header>

          <div className="analysis-theme-list" aria-label="Emotions in your reflection">
            {analysis.emotions.slice(0, 4).map((emotion, index) => (
              <span key={emotion.name} style={{ "--theme-delay": `${index * 120}ms` } as React.CSSProperties}>
                {emotion.name}
              </span>
            ))}
          </div>

          <div className="analysis-summary-visual">
            <ChakraResultsReveal chakraIds={chakraIds} />
          </div>

          <p className="analysis-summary-copy">{summary}</p>

          <div className="analysis-summary-actions">
            <button
              type="button"
              aria-expanded={detailsOpen}
              aria-controls="analysis-details"
              onClick={() => setDetailsOpen((open) => !open)}
              className="analysis-summary-button is-secondary"
            >
              Read More
            </button>
            <button
              type="button"
              onClick={beginHealing}
              disabled={analysis.safetyFlag}
              className="analysis-summary-button is-primary"
            >
              Begin Healing
            </button>
          </div>

          {analysis.safetyFlag ? (
            <p className="analysis-safety-note" role="alert">
              A guided healing session is paused for this reflection. Please choose immediate, trusted support if you feel unsafe.
            </p>
          ) : null}

          {detailsOpen ? (
            <section id="analysis-details" className="analysis-details" aria-label="Detailed emotional insight">
              <div>
                <p className="minimal-label">What may be happening</p>
                <p>{analysis.understandingSummary ?? analysis.summary}</p>
              </div>

              <div className="analysis-detail-grid">
                {analysis.chakraAssociations.map((association) => {
                  const chakra = chakraMap[association.chakra];
                  return (
                    <article key={association.chakra}>
                      <span className="analysis-detail-dot" style={{ background: chakra.color }} aria-hidden="true" />
                      <div>
                        <h2>{chakra.name}</h2>
                        <p>{association.reason}</p>
                        <p className="analysis-detail-support">
                          {association.sessionSupport ?? `The suggested practice supports ${chakra.meaning.toLowerCase()}.`}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>

              {analysis.healingApproachSummary ? (
                <div>
                  <p className="minimal-label">Why this healing path</p>
                  <p>{analysis.healingApproachSummary}</p>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </RitualBackdrop>
    </MvpShell>
  );
}

export function createConciseSummary(analysis: EmotionalAnalysis) {
  const emotionNames = analysis.emotions.slice(0, 3).map((emotion) => emotion.name.toLowerCase());
  const chakraNames = analysis.chakraAssociations
    .slice(0, 2)
    .map((association) => chakraMap[association.chakra].name.replace(" Chakra", ""));
  const emotions = joinNaturally(emotionNames) || "a mix of emotions";
  const chakras = joinNaturally(chakraNames) || "your energy centres";
  const trigger = shortPhrase(analysis.triggers[0]);
  const context = trigger ? ` around ${trigger}` : "";

  return `You seem to be carrying ${emotions}${context}. This is showing most strongly around your ${chakras}${chakraNames.length ? ` chakra${chakraNames.length > 1 ? "s" : ""}` : ""}.`;
}

function shortPhrase(value: string | undefined) {
  if (!value) return "";
  const words = value.trim().replace(/[.!?]+$/, "").split(/\s+/).slice(0, 10);
  return words.join(" ").toLowerCase();
}

function joinNaturally(items: string[]) {
  if (items.length < 2) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

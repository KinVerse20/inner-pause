"use client";

import { RitualBackdrop, inferWeatherTone } from "@/components/inner-world-ritual-ui";
import { EnergyParticleField } from "@/components/ritual-motion-visuals";

const emotionVisuals = [
  { key: "stress", label: "Stress", lineClass: "bg-[linear-gradient(90deg,rgba(235,101,38,0.05),rgba(235,101,38,0.92),rgba(235,101,38,0.05))]" },
  { key: "sadness", label: "Sadness", lineClass: "bg-[linear-gradient(90deg,rgba(87,109,164,0.05),rgba(87,109,164,0.88),rgba(87,109,164,0.05))]" },
  { key: "confusion", label: "Confusion", lineClass: "bg-[linear-gradient(90deg,rgba(149,109,209,0.05),rgba(149,109,209,0.88),rgba(149,109,209,0.05))]" },
  { key: "calm", label: "Calm", lineClass: "bg-[linear-gradient(90deg,rgba(226,192,108,0.05),rgba(226,192,108,0.88),rgba(226,192,108,0.05))]" },
];

export function ChakraProcessingScreen({
  draftText = "",
  selectedEmotions = [],
}: {
  draftText?: string;
  selectedEmotions?: string[];
}) {
  const tone = inferWeatherTone(`${selectedEmotions.join(" ")} ${draftText}`);
  const mirrorLine = buildMirrorLine(draftText, selectedEmotions);
  const keywords = getProcessingKeywords(draftText, selectedEmotions);

  return (
    <div className="fixed inset-0 z-50 px-4 py-[calc(1rem+env(safe-area-inset-top))]">
      <RitualBackdrop tone={tone} className="mx-auto min-h-[calc(100dvh-2rem)] max-w-5xl px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="relative z-10 grid min-h-[calc(100dvh-4rem)] content-center gap-7 lg:grid-cols-[minmax(18rem,25rem)_minmax(24rem,1fr)] lg:items-center">
          <div className="space-y-5 text-center lg:text-left ritual-content-enter">
            <p className="minimal-label text-xs">Processing your entry</p>
            <h1 className="font-serif text-[clamp(2.6rem,8vw,4.8rem)] leading-[0.92] text-[var(--ip-ink)]">
              Turning words into energy.
            </h1>
            <p className="text-base leading-7 text-[var(--ip-body)]">
              Listening for emotional patterns and mapping them gently to your chakras.
            </p>

            <div className="rounded-[1.35rem] border border-white/10 bg-[rgba(15,17,19,0.58)] p-4 text-left">
              <p className="minimal-label text-[0.62rem]">Emotional mirror</p>
              <p className="mt-3 font-serif text-[1.45rem] leading-8 text-[var(--ip-ink)]">{mirrorLine}</p>
            </div>
          </div>

          <div className="grid place-items-center gap-5">
            <EnergyParticleField keywords={keywords} />
            <div className="w-full max-w-md space-y-2">
              {emotionVisuals.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-full border border-white/10 bg-[rgba(15,17,19,0.42)] px-4 py-3 text-sm">
                  <span className="text-[var(--ip-ink)]">{item.label}</span>
                  <span className="processing-state-label text-[var(--ip-body)]">forming</span>
                </div>
              ))}
            </div>
            <div className="processing-progress" aria-label="Analysis in progress"><span /></div>
          </div>
        </div>
      </RitualBackdrop>
    </div>
  );
}

function getProcessingKeywords(draftText: string, selectedEmotions: string[]) {
  const excluded = new Set(["about", "after", "again", "been", "feel", "feeling", "from", "have", "just", "that", "their", "there", "these", "they", "this", "with", "your"]);
  const textKeywords = draftText
    .toLowerCase()
    .match(/[a-z]{4,}/g)
    ?.filter((word, index, words) => !excluded.has(word) && words.indexOf(word) === index)
    .slice(0, 5) ?? [];

  return [...selectedEmotions.map((emotion) => emotion.toLowerCase()), ...textKeywords].slice(0, 5);
}

function buildMirrorLine(draftText: string, selectedEmotions: string[]) {
  const lower = draftText.toLowerCase();
  if (/(tired|exhausted|drained)/.test(lower)) {
    return "You were not only tired today — you were tired of having to stay strong.";
  }
  if (/(anxious|panic|worry|pressure)/.test(lower) || selectedEmotions.includes("Anxious")) {
    return "This was not just pressure. It was your body asking for somewhere softer to land.";
  }
  if (/(angry|resent|frustrat)/.test(lower)) {
    return "There is heat here, but underneath it there may be hurt that has gone unspoken.";
  }
  if (/(sad|grief|lonely|miss)/.test(lower) || selectedEmotions.includes("Melancholic")) {
    return "This sounds like sadness that has been trying to stay quiet while still asking to be seen.";
  }
  return "There is more here than one feeling. We are gathering the parts that have been hard to carry alone.";
}

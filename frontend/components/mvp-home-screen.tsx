"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MvpShell } from "@/components/mvp-shell";
import { RitualBackdrop, RitualOrb, RitualWeatherCard, inferWeatherTone } from "@/components/inner-world-ritual-ui";
import { usePlayer } from "@/components/player-provider";
import { chakraMap } from "@/data/chakras";
import { useMvpState } from "@/lib/use-mvp-state";

function createWeatherLine(summary?: string, trigger?: string) {
  if (summary) return summary;
  if (trigger) return `Yesterday felt close to ${trigger.toLowerCase()}. How are you arriving today?`;
  return "Yesterday left a trace. You can arrive exactly as you are.";
}

function createContinuation(latestTitle?: string) {
  if (latestTitle) return `Continue where you left off with ${latestTitle.toLowerCase()}.`;
  return "Step in gently and choose the kind of support you need right now.";
}

export function MvpHomeScreen() {
  const router = useRouter();
  const player = usePlayer();
  const state = useMvpState();
  const [opening, setOpening] = useState(true);

  const latestReflection = useMemo(
    () => state.entries.find((entry) => entry.analysis || entry.rawText.trim()),
    [state.entries],
  );

  const latestEmotion = latestReflection?.analysis?.emotions[0]?.name ?? latestReflection?.title ?? "";
  const latestTrigger = latestReflection?.analysis?.triggers[0];
  const weatherTone = inferWeatherTone(`${latestEmotion} ${latestTrigger ?? ""}`);
  const latestChakraId = latestReflection?.analysis?.chakraAssociations[0]?.chakra ?? "heart";
  const latestChakra = chakraMap[latestChakraId];
  const weatherLine = createWeatherLine(latestReflection?.analysis?.understandingSummary, latestTrigger);
  const continuationLine = createContinuation(latestReflection?.title);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpening(false), 3200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <MvpShell>
      <div className="space-y-5">
        <RitualBackdrop tone={weatherTone} className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <div className="relative z-10 grid min-h-[calc(100dvh-7rem)] grid-rows-[auto_auto_1fr_auto] gap-5 lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-[1fr_minmax(0,44rem)_18rem] lg:grid-rows-[auto_1fr_auto] lg:gap-6">
            <div className="hidden lg:block" />
            <div className="space-y-3 text-center">
              <h1 className="font-serif text-[clamp(2.9rem,6vw,5rem)] leading-[0.95] text-[var(--gold-light)]">
                What are you carrying today?
              </h1>
              <p className="text-base leading-7 text-[var(--ip-body)]">You don&apos;t have to hold it alone.</p>
            </div>
            <div className="lg:self-start">
              <RitualWeatherCard title="Emotional weather" line={weatherLine} tone={weatherTone} />
            </div>

            <div className="hidden lg:block" />
            <div className="grid place-items-center">
              <RitualOrb
                stage={opening ? "arrive-opening" : "arrive"}
                tone={weatherTone}
                intensity={0.76}
                label="Inner world arrival orb"
                className="w-[min(84vw,34rem)] lg:w-[min(42vw,36rem)]"
              />
            </div>
            <div className="hidden lg:block" />

            <div className="lg:col-start-2">
              <div className="rounded-full border border-white/10 bg-[rgba(11,15,33,0.54)] px-4 py-2 text-center text-sm text-[var(--ip-body)]">
                {continuationLine}
              </div>
            </div>

            <div className="grid gap-3 lg:col-span-3 lg:grid-cols-3">
              <ActionButton title="Speak" copy="Let the orb listen first." onClick={() => router.push("/journal?mode=speak")} />
              <ActionButton title="Write" copy="Put it down without forcing clarity." onClick={() => router.push("/journal?mode=write")} />
              <ActionButton
                title="I just need relief"
                copy="Find calm, comfort, and support."
                onClick={() => player.startQuickPlayback({ chakraId: latestChakra.id, moodId: "calm", duration: 20 })}
              />
            </div>
          </div>
        </RitualBackdrop>
      </div>
    </MvpShell>
  );
}

function ActionButton({
  title,
  copy,
  onClick,
}: {
  title: string;
  copy: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap-ripple block w-full rounded-[1.45rem] border border-[rgba(216,172,107,0.24)] bg-[rgba(18,20,22,0.52)] px-4 py-4 text-left shadow-[0_18px_42px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[rgba(216,172,107,0.42)] focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)]"
    >
      <span className="block font-serif text-[1.7rem] leading-tight text-[var(--ip-ink)]">{title}</span>
      <span className="mt-2 block text-sm leading-6 text-[var(--ip-body)]">{copy}</span>
    </button>
  );
}

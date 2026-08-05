"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

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

  return (
    <MvpShell>
      <div className="space-y-5 lg:space-y-6">
        <RitualBackdrop tone={weatherTone} className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="relative z-10 grid min-h-[calc(100dvh-9rem)] content-between gap-6 lg:min-h-[calc(100dvh-2.5rem)] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_minmax(18rem,22rem)] lg:items-center lg:gap-8">
            <div className="space-y-4 text-center lg:text-left">
              <p className="minimal-label text-xs">Arrive</p>
              <h1 className="font-serif text-[clamp(2.9rem,10vw,5.6rem)] leading-[0.92] text-[var(--ip-ink)]">
                What are you carrying today?
              </h1>
              <p className="max-w-md text-base leading-7 text-[var(--ip-body)]">
                You don&apos;t have to hold it alone.
              </p>
              <div className="lg:max-w-sm">
                <RitualWeatherCard title="Emotional weather" line={weatherLine} tone={weatherTone} />
              </div>
            </div>

            <div className="grid place-items-center">
              <RitualOrb stage="arrive" tone={weatherTone} intensity={0.62} label="Inner world arrival orb" />
            </div>

            <div className="space-y-3">
              <ActionButton
                title="Speak"
                copy="Let the orb listen first. Speak freely and let the atmosphere respond."
                onClick={() => router.push("/journal?mode=speak")}
              />
              <ActionButton
                title="Write"
                copy="Enter the page quietly and put words down without distraction."
                onClick={() => router.push("/journal?mode=write")}
              />
              <ActionButton
                title="I just need relief"
                copy="Skip the deeper reflection and go straight into calming support."
                onClick={() => player.startQuickPlayback({ chakraId: latestChakra.id, moodId: "calm", duration: 20 })}
              />

              <div className="pt-2">
                <RitualWeatherCard title="Continuation" line={continuationLine} tone={weatherTone} />
              </div>
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
      className="tap-ripple block w-full rounded-[1.45rem] border border-white/10 bg-[rgba(18,20,22,0.62)] px-4 py-4 text-left shadow-[0_18px_42px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-[rgba(244,122,34,0.35)] focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)]"
    >
      <span className="block font-serif text-[1.7rem] leading-tight text-[var(--ip-ink)]">{title}</span>
      <span className="mt-2 block text-sm leading-6 text-[var(--ip-body)]">{copy}</span>
    </button>
  );
}


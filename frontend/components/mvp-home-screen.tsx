"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BlushChoicePanel, SunriseScene } from "@/components/morning-blush-ui";
import { MvpShell } from "@/components/mvp-shell";
import { usePlayer } from "@/components/player-provider";
import { chakraMap } from "@/data/chakras";
import { useMvpState } from "@/lib/use-mvp-state";
import type { ChakraId, RelaxMoodId } from "@/lib/types";

const intentionChoices: Array<{ label: string; moodId: RelaxMoodId; chakraId: ChakraId }> = [
  { label: "Release Stress", moodId: "calm", chakraId: "heart" },
  { label: "Find Clarity", moodId: "focus", chakraId: "third-eye" },
  { label: "Emotional Balance", moodId: "emotionally-lighter", chakraId: "sacral" },
  { label: "Better Sleep", moodId: "sleep", chakraId: "crown" },
  { label: "Self Love", moodId: "positive", chakraId: "solar-plexus" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function MvpHomeScreen() {
  const router = useRouter();
  const state = useMvpState();
  const player = usePlayer();
  const [panelOpen, setPanelOpen] = useState(false);
  const firstName = state.profile.fullName?.split(" ")[0] || "Sahil";
  const recommended = useMemo(() => {
    const latestChakra = state.entries.find((entry) => entry.analysis)?.analysis?.chakraAssociations[0]?.chakra as ChakraId | undefined;
    return latestChakra ? chakraMap[latestChakra] : chakraMap.heart;
  }, [state.entries]);

  const playChoice = (choice: (typeof intentionChoices)[number]) => {
    player.startQuickPlayback({ chakraId: choice.chakraId, moodId: choice.moodId, duration: 20 });
    setPanelOpen(false);
  };

  return (
    <MvpShell>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <SunriseScene>
          <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col items-center justify-between px-4 py-6 text-center sm:px-8 lg:min-h-[calc(100dvh-3rem)] lg:justify-center lg:py-6">
            <div className="mx-auto max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold-light)]">{greeting()}, {firstName}</p>
              <h1 className="mt-4 font-serif text-[clamp(3rem,10vw,7rem)] leading-[0.82] tracking-[-0.04em] text-[var(--ip-ink)] lg:text-[5.3rem]">
                RESONA<br />NCE
              </h1>
              <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[var(--ip-body)] sm:text-base">
                Explore your inner cosmic frequencies. Map your feelings to the sacred architecture of your chakras.
              </p>
            </div>

            <div className="my-4 grid place-items-center sm:my-5 lg:my-4">
              <div className="sacred-orb" aria-hidden="true" />
            </div>

            <div className="grid w-full max-w-3xl gap-3 rounded-[1.55rem] border border-white/70 bg-white/46 p-3 shadow-[0_22px_54px_rgba(169,139,221,0.12)] backdrop-blur-xl sm:grid-cols-2 sm:p-4">
              <HomeAction title="Enter the Portal" copy="Begin guided healing" icon="✦" onClick={() => router.push("/journey")} />
              <HomeAction title="Analyze Vibration" copy="Speak or write now" icon="♩" onClick={() => router.push("/journal?mode=speak")} />
            </div>
          </div>
        </SunriseScene>

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--ip-muted)]">
          <button type="button" onClick={() => player.startQuickPlayback({ chakraId: recommended.id, duration: 20 })} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-white/70 px-5 font-semibold text-[var(--gold-light)]">
            Play recommended reset
          </button>
          <button type="button" onClick={() => setPanelOpen(true)} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-white/70 px-5 py-3 font-semibold text-[var(--ip-body)]">
            Choose your intention
          </button>
        </div>
      </div>

      {panelOpen ? (
        <BlushChoicePanel
          title="What do you need right now?"
          onClose={() => setPanelOpen(false)}
          choices={intentionChoices.map((choice) => ({
            label: choice.label,
            onClick: () => playChoice(choice),
          }))}
        />
      ) : null}
    </MvpShell>
  );
}

function HomeAction({
  title,
  copy,
  icon,
  onClick,
  className = "",
}: {
  title: string;
  copy: string;
  icon: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-[5.35rem] rounded-[1.15rem] border border-[var(--gold-border-soft)] bg-white/72 p-2.5 text-center text-[var(--ip-ink)] shadow-[0_18px_44px_rgba(169,139,221,0.13)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)] sm:min-h-28 sm:p-4 ${className}`}
    >
      <span className="mx-auto grid h-9 w-9 place-items-center rounded-2xl border border-[var(--gold-border-soft)] bg-[var(--ip-lavender)] text-xl text-[var(--gold-light)] shadow-[0_0_24px_rgba(169,139,221,0.12)] sm:h-12 sm:w-12 sm:text-3xl">
        {icon}
      </span>
      <span className="mt-1.5 block font-serif text-lg sm:mt-3 sm:text-2xl">{title}</span>
      <span className="mt-0.5 block text-[0.7rem] leading-4 text-[var(--ip-muted)] sm:mt-1 sm:text-sm">{copy}</span>
    </button>
  );
}

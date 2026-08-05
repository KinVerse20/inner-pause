"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BlushChoicePanel, SunriseScene } from "@/components/morning-blush-ui";
import { MvpShell } from "@/components/mvp-shell";
import { usePlayer } from "@/components/player-provider";
import { chakraMap } from "@/data/chakras";
import { useMvpState } from "@/lib/use-mvp-state";
import type { ChakraId, RelaxMoodId } from "@/lib/types";

const intentionChoices: Array<{ label: string; moodId: RelaxMoodId; chakraId: ChakraId }> = [
  { label: "Release stress", moodId: "calm", chakraId: "heart" },
  { label: "Find clarity", moodId: "focus", chakraId: "third-eye" },
  { label: "Emotional balance", moodId: "emotionally-lighter", chakraId: "sacral" },
  { label: "Better sleep", moodId: "sleep", chakraId: "crown" },
  { label: "Self-love", moodId: "positive", chakraId: "solar-plexus" },
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
          <div className="flex min-h-[clamp(20.5rem,54dvh,34rem)] flex-col items-center justify-center px-4 py-4 text-center sm:px-8 sm:py-6 lg:min-h-[36rem]">
            <div className="mx-auto max-w-2xl">
              <p className="text-sm font-medium text-[var(--gold-muted)]">{greeting()}, {firstName}</p>
              <h1 className="mt-4 font-serif text-[clamp(2.35rem,8vw,5.25rem)] leading-[0.96] text-[var(--cream)] drop-shadow-[0_2px_18px_rgba(7,20,47,0.35)]">
                What are you<br className="hidden sm:block" /> carrying today?
              </h1>
              <p className="mx-auto mt-4 max-w-md text-base text-[var(--ip-body)]">You don’t have to hold it alone.</p>
            </div>

            <div className="mt-4 grid w-full max-w-3xl grid-cols-2 gap-2.5 sm:mt-7 sm:grid-cols-3 sm:gap-3">
              <HomeAction title="Speak" copy="Talk it out loud" icon="♩" onClick={() => router.push("/journal?mode=speak")} />
              <HomeAction title="Write" copy="Journal your thoughts" icon="✎" onClick={() => router.push("/journal?mode=write")} />
              <HomeAction title="Just need relief" copy="Find calm and reset" icon="♧" onClick={() => setPanelOpen(true)} className="col-span-2 sm:col-span-1" />
            </div>
          </div>
        </SunriseScene>

        <div className="hidden flex-wrap items-center justify-center gap-3 text-sm text-[var(--ip-muted)] sm:flex">
          <button type="button" onClick={() => player.startQuickPlayback({ chakraId: recommended.id, duration: 20 })} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-white/8 px-5 font-semibold text-[var(--gold-light)]">
            Play recommended reset
          </button>
          <Link href="/about" className="min-h-11 rounded-full border border-[var(--gold-border-soft)] px-5 py-3 font-semibold text-[var(--ip-body)]">
            About The Inner Pause
          </Link>
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
      className={`group min-h-[5.35rem] rounded-[1.15rem] border border-[var(--gold-border-soft)] bg-[#19264d]/66 p-2.5 text-center text-[var(--cream)] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-[#243464]/72 focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)] sm:min-h-36 sm:p-4 ${className}`}
    >
      <span className="mx-auto grid h-9 w-9 place-items-center rounded-2xl border border-[var(--gold-border-soft)] text-xl text-[var(--gold-light)] shadow-[0_0_24px_rgba(240,206,160,0.12)] sm:h-12 sm:w-12 sm:text-3xl">
        {icon}
      </span>
      <span className="mt-1.5 block font-serif text-lg sm:mt-3 sm:text-2xl">{title}</span>
      <span className="mt-0.5 block text-[0.7rem] leading-4 text-[var(--ip-body)] sm:mt-1 sm:text-sm">{copy}</span>
    </button>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BlushCard, BlushChoicePanel, CircularActionButton, SunriseScene } from "@/components/morning-blush-ui";
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
  const state = useMvpState();
  const player = usePlayer();
  const [panelOpen, setPanelOpen] = useState(false);
  const firstName = state.profile.fullName?.split(" ")[0] || "Sahil";
  const savedEntries = state.entries.filter((entry) => !entry.isTemporary);
  const completedPlans = state.entries.filter((entry) => entry.plan?.status === "completed").length;
  const latestPlan = state.entries.find((entry) => entry.plan)?.plan;
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
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-start">
        <SunriseScene>
          <div className="flex min-h-[clamp(22rem,58dvh,31rem)] flex-col items-center justify-between px-5 py-5 text-center sm:py-6 lg:min-h-[32rem]">
            <div>
              <p className="text-sm font-medium text-[#6f687d]">{greeting()}, {firstName}</p>
              <h1 className="mt-4 font-serif text-4xl leading-tight text-[#322d42]">Find your<br />inner pause</h1>
            </div>

            <div className="grid place-items-center">
              <CircularActionButton label="Tell us how you feel" onClick={() => setPanelOpen(true)}>
                🎙
              </CircularActionButton>
              <p className="mt-3 text-sm font-medium text-[#6f687d]">Tell us how you feel</p>
            </div>
          </div>
        </SunriseScene>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5">
          <BlushCard className="p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fbedee] text-xl text-[#d58e93]">✦</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#90879d]">Today’s recommended reset</p>
                <p className="truncate font-serif text-xl text-[#322d42]">{recommended.name.replace(" Chakra", "")} music</p>
                <p className="text-sm text-[#6f687d]">{recommended.meaning}</p>
              </div>
              <button
                type="button"
                onClick={() => player.startQuickPlayback({ chakraId: recommended.id, duration: 20 })}
                className="grid h-11 w-11 place-items-center rounded-full bg-[#eca98f] text-white shadow-[0_12px_28px_rgba(236,169,143,0.28)]"
                aria-label="Play recommended reset"
              >
                ▶
              </button>
            </div>
          </BlushCard>

          <div className="grid grid-cols-2 gap-3">
            <BlushCard className="p-4">
              <p className="text-xs text-[#90879d]">Current streak</p>
              <p className="mt-1 font-serif text-3xl text-[#322d42]">{Math.max(0, completedPlans)}</p>
              <p className="text-sm text-[#6f687d]">completed resets</p>
            </BlushCard>
            <BlushCard className="p-4">
              <p className="text-xs text-[#90879d]">Journey progress</p>
              <p className="mt-1 font-serif text-3xl text-[#322d42]">{savedEntries.length}</p>
              <p className="text-sm text-[#6f687d]">saved reflections</p>
            </BlushCard>
          </div>

          <Link href={latestPlan ? `/healing?entry=${state.entries.find((entry) => entry.plan?.id === latestPlan.id)?.id}` : "/healing"} className="block rounded-full border border-white/70 bg-white/70 px-5 py-3 text-center text-sm font-semibold text-[#a77d97] shadow-[0_12px_30px_rgba(152,117,139,0.12)]">
            Open Healing Plan
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

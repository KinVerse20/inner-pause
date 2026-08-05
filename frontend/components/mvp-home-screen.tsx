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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <SunriseScene>
          <div className="flex min-h-[32rem] flex-col items-center justify-between px-4 py-5 text-center sm:min-h-[34rem] sm:px-8 lg:min-h-[calc(100dvh-2.5rem)] lg:py-7">
            <div className="mx-auto max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold-light)]">{greeting()}, {firstName}</p>
              <h1 className="mt-3 font-serif text-[clamp(2.35rem,8vw,4.8rem)] leading-[0.95] text-[var(--ip-ink)]">How are you today?</h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ip-body)]">Choose one gentle way to begin.</p>
            </div>

            <div className="relative my-4 grid place-items-center">
              <div className="animated-lotus" aria-hidden="true">
                {Array.from({ length: 10 }).map((_, index) => (
                  <span key={index} className="lotus-petal" style={{ transform: `rotate(${index * 36}deg) translateY(-24%)` }} />
                ))}
                {Array.from({ length: 7 }).map((_, index) => (
                  <span key={`spark-${index}`} className="lotus-particle" style={{ width: "0.32rem", height: "0.32rem", left: `${16 + index * 11}%`, top: `${18 + (index % 3) * 18}%`, animationDelay: `${index * 1.4}s` }} />
                ))}
              </div>
            </div>

            <div className="grid w-full max-w-xl grid-cols-3 gap-3">
              <CircleAction title="Speak" icon="♩" onClick={() => router.push("/journal?mode=speak")} />
              <CircleAction title="Write" icon="✎" onClick={() => router.push("/journal?mode=write")} />
              <CircleAction title="Reset" icon="♧" onClick={() => setPanelOpen(true)} />
            </div>
          </div>
          </SunriseScene>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:grid-rows-[auto_auto_auto] lg:gap-4">
            <SummaryCard title="Today’s flow" value="Soft start" copy="Speak, write or reset in under a minute." />
            <SummaryCard title="Suggested session" value={recommended.name.replace(" Chakra", "")} copy={`${recommended.frequencyLabel} · 20 min`} />
            <SummaryCard title="Progress" value={`${state.entries.length} logs`} copy="Your recent reflections shape future sessions." />
          </div>
        </div>

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

function CircleAction({
  title,
  icon,
  onClick,
}: {
  title: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid min-h-[6rem] place-items-center rounded-[1.4rem] border border-[var(--gold-border-soft)] bg-white/72 p-2 text-center text-[var(--ip-ink)] shadow-[0_18px_44px_rgba(169,139,221,0.13)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)] sm:min-h-32"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-[var(--ip-lavender)] text-2xl text-[var(--gold-light)] shadow-[0_0_24px_rgba(169,139,221,0.16)] sm:h-16 sm:w-16 sm:text-3xl">
        {icon}
      </span>
      <span className="block font-serif text-lg sm:text-2xl">{title}</span>
    </button>
  );
}

function SummaryCard({ title, value, copy }: { title: string; value: string; copy: string }) {
  return (
    <section className="rounded-[1.45rem] border border-[var(--gold-border-soft)] bg-white/70 p-4 shadow-[0_18px_44px_rgba(169,139,221,0.12)] backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--ip-muted)]">{title}</p>
      <p className="mt-2 font-serif text-2xl text-[var(--ip-ink)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">{copy}</p>
    </section>
  );
}

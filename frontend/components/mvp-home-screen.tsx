"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

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

function parsePreviewTime(value: string | null) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  const preview = new Date();
  preview.setHours(hour, minute, 0, 0);
  return preview;
}

function getSphereState(date: Date) {
  const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
  const dayProgress = minutesSinceMidnight / 1440;
  const angle = dayProgress * 360;
  const radians = ((angle - 90) * Math.PI) / 180;
  const hour = date.getHours();
  const phase =
    hour < 5 ? "night" :
    hour < 8 ? "dawn" :
    hour < 17 ? "day" :
    hour < 20 ? "sunset" :
    "night";

  return {
    angle,
    x: 50 + Math.cos(radians) * 42,
    y: 50 + Math.sin(radians) * 42,
    brightness: phase === "day" ? 1.14 : phase === "sunset" ? 1.08 : phase === "dawn" ? 1 : 0.82,
    glow: phase === "sunset" ? 0.82 : phase === "dawn" ? 0.62 : phase === "day" ? 0.38 : 0.28,
  };
}

export function MvpHomeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useMvpState();
  const player = usePlayer();
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<"calm" | "focus" | "express">("focus");
  const [clockNow, setClockNow] = useState(() => new Date());
  const previewTime = searchParams.get("previewTime");
  const previewDate = useMemo(() => parsePreviewTime(previewTime), [previewTime]);
  const recommended = useMemo(() => {
    const latestChakra = state.entries.find((entry) => entry.analysis)?.analysis?.chakraAssociations[0]?.chakra as ChakraId | undefined;
    return latestChakra ? chakraMap[latestChakra] : chakraMap.heart;
  }, [state.entries]);
  const orbit = getSphereState(previewDate ?? clockNow);

  useEffect(() => {
    if (previewDate) return;

    const update = () => setClockNow(new Date());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [previewDate]);

  const playChoice = (choice: (typeof intentionChoices)[number]) => {
    player.startQuickPlayback({ chakraId: choice.chakraId, moodId: choice.moodId, duration: 20 });
    setPanelOpen(false);
  };

  return (
    <MvpShell>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-0 2xl:grid-cols-[minmax(0,1fr)_18rem]">
        <SunriseScene>
          <div className="flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-between px-4 py-4 text-center sm:min-h-[38rem] lg:min-h-[calc(100dvh-2.5rem)] lg:px-8 lg:py-7">
            <div className="grid w-full grid-cols-[2.75rem_1fr_2.75rem] items-center">
              <button type="button" onClick={() => router.push("/journal?mode=speak")} className="grid h-11 w-11 place-items-center rounded-full text-2xl text-[var(--ip-body)]" aria-label="Open express">☰</button>
              <p className="minimal-label text-center text-xs">Check-In</p>
              <button type="button" onClick={() => router.push("/profile")} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-xl text-[var(--ip-body)]" aria-label="Profile">◎</button>
            </div>

            <div className="relative my-6 grid w-full flex-1 place-items-center">
              <div
                className="time-orbit-sphere"
                aria-label={`Time orbit sphere, ${Math.round(orbit.angle)} degrees through the day`}
                style={
                  {
                    "--light-x": `${orbit.x}%`,
                    "--light-y": `${orbit.y}%`,
                    "--sphere-brightness": orbit.brightness,
                    "--sphere-glow": orbit.glow,
                  } as CSSProperties
                }
              >
                <span className="radar-sweep" />
                <span className="frequency-scan" />
                <span className="frequency-ring" />
                <span className="frequency-ring" />
                <span className="frequency-ring" />
                <span className="sphere-core-pulse" />
                <span className="orbital-track" />
                <span className="orbital-track" />
                <span className="orbital-track" />
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className="orange-particle"
                    style={{
                      left: `${20 + index * 14}%`,
                      top: `${34 + (index % 3) * 16}%`,
                      animationDelay: `${index * 1.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="minimal-label text-sm">Ready?</p>
              <div className="mx-auto mt-3 h-px w-7 bg-[var(--gold-primary)] shadow-[0_0_12px_rgba(255,122,34,0.8)]" />
            </div>

            <div className="grid w-full max-w-md grid-cols-3 gap-3 pt-4 sm:gap-5">
              <CircleAction title="Calm Me" shortTitle="Calm" hint="Slow down" icon="♡" selected={selected === "calm"} onClick={() => { setSelected("calm"); player.startQuickPlayback({ chakraId: "heart", moodId: "calm", duration: 10 }); }} />
              <CircleAction title="Help Me Focus" shortTitle="Focus" hint="Clear your mind" icon="⊙" selected={selected === "focus"} onClick={() => { setSelected("focus"); router.push("/journal?mode=write"); }} />
              <CircleAction title="Let It Out" shortTitle="Express" hint="Speak or write" icon="≋" selected={selected === "express"} onClick={() => { setSelected("express"); router.push("/journal?mode=speak"); }} />
            </div>

            <div className="flex gap-3 pt-3" aria-label="Check-in pages">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-primary)] shadow-[0_0_12px_rgba(255,138,50,0.8)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/14" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/14" />
            </div>
          </div>
        </SunriseScene>

        <aside className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3 lg:hidden 2xl:grid 2xl:grid-cols-1 2xl:content-center 2xl:border-l 2xl:border-t-0 2xl:px-5 2xl:pt-0">
          <SummaryCard title="Calm" value="08:24" onClick={() => player.startQuickPlayback({ chakraId: "heart", moodId: "calm", duration: 20 })} />
          <SummaryCard title="Focus" value="06:12" onClick={() => router.push("/journal?mode=write")} />
          <SummaryCard title="Restore" value={recommended.frequencyLabel} onClick={() => setPanelOpen(true)} />
        </aside>
      </div>

      {panelOpen ? (
        <BlushChoicePanel
          title="Choose"
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
  shortTitle,
  hint,
  icon,
  selected,
  onClick,
}: {
  title: string;
  shortTitle: string;
  hint: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`tap-ripple group grid place-items-center gap-3 text-center text-[var(--ip-ink)] transition focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)] ${selected ? "scale-[1.03]" : ""}`}
    >
      <span className={`grid h-16 w-16 place-items-center rounded-full border text-2xl shadow-[0_18px_44px_rgba(0,0,0,0.24)] sm:h-20 sm:w-20 sm:text-3xl ${selected ? "border-[rgba(255,138,50,0.72)] bg-[rgba(244,122,34,0.08)] text-[var(--gold-light)] shadow-[0_0_34px_rgba(255,122,34,0.18)]" : "border-white/10 bg-white/[0.035] text-[var(--ip-body)]"}`}>
        {icon}
      </span>
      <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)] sm:hidden">{shortTitle}</span>
      <span className="minimal-label hidden text-[0.72rem] sm:block">{title}</span>
      <span className="hidden text-xs text-[var(--ip-muted)] sm:block">{hint}</span>
    </button>
  );
}

function SummaryCard({ title, value, onClick }: { title: string; value: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="tap-ripple flex min-h-20 items-center gap-4 rounded-[1rem] border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-[rgba(255,138,50,0.35)]">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-[var(--gold-light)]">◎</span>
      <span className="min-w-0 flex-1">
        <span className="minimal-label block text-[0.7rem]">{title}</span>
        <span className="mt-1 block text-lg text-[var(--ip-body)]">{value}</span>
      </span>
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-primary)] shadow-[0_0_12px_rgba(255,138,50,0.8)]" />
    </button>
  );
}

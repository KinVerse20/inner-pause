"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { BlushCard, SunriseScene } from "@/components/morning-blush-ui";
import { GoldButton, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { savePlan, saveReflectionToJourney } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

const actionTemplates = [
  { title: "Healing Music", icon: "♫", duration: "20 min", benefit: "Softens emotional pressure" },
  { title: "Breath Flow", icon: "≋", duration: "5 min", benefit: "Helps your body settle" },
  { title: "Journal Thought", icon: "✎", duration: "5 min", benefit: "Turns the feeling into clarity" },
];

export function HealingPlanScreen() {
  const router = useRouter();
  const entryId = useSearchParams().get("entry");
  const state = useMvpState();
  const [expanded, setExpanded] = useState(0);
  const entry = useMemo(() => {
    if (entryId) return state.entries.find((item) => item.id === entryId);
    return state.entries.find((item) => item.plan) ?? state.entries.find((item) => item.analysis);
  }, [entryId, state.entries]);
  const plan = entry?.plan;

  if (!entry?.analysis) {
    return (
      <MvpShell>
        <BlushCard className="p-5">
          <h1 className="font-serif text-2xl text-[var(--ip-ink)]">No healing plan yet</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">Share one reflection to receive a simple reset plan.</p>
          <Link href="/journal" className="mt-4 inline-flex rounded-full border border-[var(--gold-border-soft)] bg-white/64 px-5 py-3 text-sm font-semibold text-[var(--gold-light)]">Open Journal</Link>
        </BlushCard>
      </MvpShell>
    );
  }

  if (!plan) {
    return (
      <MvpShell>
        <BlushCard className="p-5">
          <h1 className="font-serif text-2xl text-[var(--ip-ink)]">Your plan is almost ready</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">Confirm your reflection to create a reset.</p>
          <GoldButton className="mt-4" onClick={() => { savePlan(entry.id); router.refresh(); }}>Create Healing Plan</GoldButton>
        </BlushCard>
      </MvpShell>
    );
  }

  const primaryChakra = plan.blocks[0]?.chakraId ? chakraMap[plan.blocks[0].chakraId] : chakraMap.heart;
  const actions = actionTemplates.map((action, index) => ({
    ...action,
    duration: index === 0 ? `${plan.blocks[0]?.durationMinutes ?? 20} min` : action.duration,
    completed: plan.status === "completed" && index === 0,
  }));

  return (
    <MvpShell>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5 lg:grid-cols-[minmax(0,0.95fr)_minmax(20rem,1.05fr)] lg:items-start">
        <SunriseScene variant="plan">
          <div className="min-h-[clamp(12rem,32dvh,15rem)] px-5 py-5 text-center sm:py-6 lg:min-h-[26rem] lg:flex lg:flex-col lg:justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold-light)]">Healing Plan</p>
            <h1 className="mt-3 font-serif text-[clamp(2.1rem,6vw,4rem)] text-[var(--ip-ink)]">Flow with ease</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--ip-body)]">{entry.analysis.understandingSummary ?? entry.analysis.summary}</p>
          </div>
        </SunriseScene>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
            {actions.map((action, index) => (
              <HealingActionCard
                key={action.title}
                {...action}
                active={expanded === index}
                onClick={() => {
                  setExpanded(index);
                  if (index === 0) router.push(`/healing/player?plan=${plan.id}`);
                }}
                chakraName={primaryChakra.name.replace(" Chakra", "")}
              />
            ))}
          </div>

          <BlushCard className="p-4">
            <p className="font-serif text-xl text-[var(--ip-ink)]">Keep this reflection?</p>
            <p className="mt-1 text-sm leading-6 text-[var(--ip-body)]">Saving it helps future insights feel more personal.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => saveReflectionToJourney(entry.id)} className="min-h-11 rounded-full bg-[linear-gradient(135deg,#a98bdd,#f4b8cd)] px-4 font-semibold text-white">Save to Journey</button>
              <button type="button" onClick={() => router.push("/journal")} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-white/64 px-4 font-semibold text-[var(--ip-body)]">New Journal Thought</button>
            </div>
          </BlushCard>

          <GoldButton className="w-full" onClick={() => router.push(`/healing/player?plan=${plan.id}`)}>
            Start Reset
          </GoldButton>
        </div>
      </div>
    </MvpShell>
  );
}

function HealingActionCard({
  title,
  icon,
  duration,
  benefit,
  active,
  completed,
  onClick,
  chakraName,
}: {
  title: string;
  icon: string;
  duration: string;
  benefit: string;
  active: boolean;
  completed: boolean;
  onClick: () => void;
  chakraName: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-white/72 p-3 text-left shadow-[0_12px_30px_rgba(169,139,221,0.12)] backdrop-blur-xl transition ${completed ? "opacity-55" : "hover:bg-white/90"}`}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--gold-border-soft)] bg-[var(--ip-lavender)] text-xl text-[var(--gold-light)]">{completed ? "✓" : icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-xl text-[var(--ip-ink)]">{title}</span>
          <span className="block text-sm text-[var(--ip-body)]">{duration} · {benefit}</span>
        </span>
        <span className="text-2xl text-[var(--gold-primary)]">›</span>
      </div>
      {active ? <p className="mt-3 rounded-2xl bg-white/64 px-3 py-2 text-sm leading-6 text-[var(--ip-body)]">Recommended for your {chakraName} focus. Tap again when you are ready to begin.</p> : null}
    </button>
  );
}

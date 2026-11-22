"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { IconChevronRight } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { Stagger, StaggerItem } from "@/components/reveal";
import { haptic } from "@/lib/haptics";
import { PATH_LENGTH_DAYS, PATH_PRESENTATION } from "@/lib/practice-path-presentation";
import { programmes, type Programme } from "@/lib/programme-data";
import {
  activeProgramme,
  currentProgrammeDay,
  programmeStreak,
  readProgrammeState,
  type ProgrammeEnrollment,
  type ProgrammeState,
} from "@/lib/programme-storage";

// Practice (PRODUCT_FLOW.md "Help me become better at something"): five
// 14-day paths, each a capability built one small real-world step at a time.
// One thing to continue (if a path is active), then the five paths.
export function PracticeScreen() {
  const [state, setState] = useState<ProgrammeState>({ enrollments: [] });

  useEffect(() => {
    const load = () => setState(readProgrammeState());
    load();
    window.addEventListener("innerpause-practice-change", load);
    return () => window.removeEventListener("innerpause-practice-change", load);
  }, []);

  const active = activeProgramme(state);
  const activePath = active ? programmes.find((path) => path.id === active.issueId) : undefined;
  const latestFor = (path: Programme) =>
    state.enrollments.filter((item) => item.issueId === path.id).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

  return (
    <PauseShell>
      <Stagger className="space-y-7 pb-4 pt-2">
        <StaggerItem>
          <header>
            <h1 className="ds-display text-[1.85rem]">Practice</h1>
            <p className="mt-1.5 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              Build a capability, one small day at a time.
            </p>
          </header>
        </StaggerItem>

        {active && activePath ? (
          <StaggerItem>
            <ContinueCard path={activePath} enrollment={active} />
          </StaggerItem>
        ) : null}

        <StaggerItem>
          <section aria-labelledby="paths-title" className="space-y-3">
            <h2 id="paths-title" className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
              {active ? "All paths" : "Choose a path"}
            </h2>
            <div className="ds-card divide-y overflow-hidden">
              {programmes.map((path) => {
                const { tone, Icon } = PATH_PRESENTATION[path.id];
                const latest = latestFor(path);
                const status = !latest
                  ? `${PATH_LENGTH_DAYS} days`
                  : latest.status === "completed"
                    ? "Completed"
                    : `Day ${currentProgrammeDay(latest)} of ${PATH_LENGTH_DAYS}`;
                return (
                  <Link
                    key={path.id}
                    href={`/practice/${path.id}`}
                    onClick={() => haptic("tap")}
                    className="ds-tap flex min-h-[4.75rem] items-center gap-3.5 px-4 py-3.5"
                  >
                    <span
                      className="ds-outcome-icon grid h-11 w-11 shrink-0 place-items-center rounded-full"
                      style={{ ["--ds-outcome-color" as string]: `var(--ds-outcome-${tone})` }}
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="ds-h3 block">{path.title}</span>
                      <span className="mt-0.5 block text-[0.85rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                        {path.subtitle}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <span className="ds-caption ds-num">{status}</span>
                      <IconChevronRight className="h-4 w-4" style={{ color: "var(--ds-text-muted)" }} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <section className="rounded-[var(--ds-radius-lg)] px-5 py-4" style={{ background: "var(--ds-accent-soft)" }}>
            <h2 className="ds-h3">How a path works</h2>
            <ol className="mt-3 grid gap-2 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              {["Check in about yesterday", "Listen and practise", "Use one small action in real life", "Reflect and build your rhythm"].map(
                (step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="ds-num w-4 shrink-0" style={{ color: "var(--ds-accent)" }}>
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ),
              )}
            </ol>
            <p className="ds-caption mt-3">Supportive wellbeing practice, not medical treatment.</p>
          </section>
        </StaggerItem>
      </Stagger>
    </PauseShell>
  );
}

function ContinueCard({ path, enrollment }: { path: Programme; enrollment: ProgrammeEnrollment }) {
  const { tone, Icon } = PATH_PRESENTATION[path.id];
  const day = currentProgrammeDay(enrollment);
  const streak = programmeStreak(enrollment);
  const today = path.days[day - 1];
  return (
    <Link
      href={`/practice/${path.id}`}
      onClick={() => haptic("tap")}
      className="ds-tap ds-card-lift block overflow-hidden rounded-[var(--ds-radius-lg)] px-5 py-5"
      style={{ background: `color-mix(in srgb, var(--ds-outcome-${tone}) 13%, var(--ds-surface))`, boxShadow: "var(--ds-elevation-1)" }}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="ds-label uppercase" style={{ color: "var(--ds-text-secondary)" }}>
          Continue · {path.title}
        </span>
      </span>
      <span className="ds-h2 mt-3 block">{today?.title ?? path.title}</span>
      <span className="mt-1 block text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
        {today?.intention}
      </span>
      <span className="mt-4 flex items-center justify-between gap-3">
        <span className="ds-caption ds-num" style={{ color: "var(--ds-text-secondary)" }}>
          Day {day} of {PATH_LENGTH_DAYS}
          {streak > 0 ? ` · ${streak} day rhythm` : ""}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--ds-accent)" }}>
          Begin today
          <IconChevronRight className="h-4 w-4" />
        </span>
      </span>
      <span className="mt-3 block h-1.5 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--ds-text) 8%, transparent)" }}>
        <span
          className="block h-full rounded-full"
          style={{ width: `${(enrollment.completions.length / PATH_LENGTH_DAYS) * 100}%`, background: `var(--ds-outcome-${tone})` }}
        />
      </span>
    </Link>
  );
}

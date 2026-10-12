"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { IconCheck, IconChevronRight } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { getCoreArc } from "@/lib/practice-content";
import { hasEarnedCoreArcMilestone } from "@/lib/practice-engine";
import { canStartNewPracticeSession, getPracticeEntitlement, type PracticeEntitlement } from "@/lib/practice-entitlement";
import { getMilestoneProgress } from "@/lib/practice-milestones";
import { practiceSkillMap, type PracticeSkill } from "@/lib/practice-skills";
import { ensureEnrollment, listPracticeSessionRecords, type PracticeEnrollment } from "@/lib/practice-storage";

// Practice — Skill Journey (Practice Completion pass §3): not a hub, not a
// flat session list. Answers, in order: where am I, what am I practicing
// now, what have I already built, what am I working toward.
export function PracticeSkillJourneyScreen({ skill }: { skill: PracticeSkill }) {
  const [enrollment, setEnrollment] = useState<PracticeEnrollment | null>(null);
  const [entitlement, setEntitlement] = useState<PracticeEntitlement | null>(null);
  const arc = getCoreArc(skill.id);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnrollment(ensureEnrollment(skill.id));
    setEntitlement(getPracticeEntitlement());
  }, [skill.id]);

  if (!enrollment || !entitlement) {
    return (
      <PauseShell>
        <div className="space-y-4 pb-4 pt-2">
          <BackLink />
        </div>
      </PauseShell>
    );
  }

  const records = listPracticeSessionRecords(skill.id);
  const arcMilestoneEarned = hasEarnedCoreArcMilestone(skill.id, records);
  const { path, reachedCount } = getMilestoneProgress(skill.id, records, arcMilestoneEarned);
  const currentMilestone = reachedCount > 0 ? path[reachedCount - 1] : null;
  const nextMilestone = path[reachedCount] ?? null;

  const isNew = enrollment.completedSessionNumbers.length === 0;
  const isOngoing = enrollment.phase === "ongoing" || arcMilestoneEarned;
  const canStart = canStartNewPracticeSession(skill.id);
  const freeLockedElsewhere = !entitlement.hasPass && entitlement.freeSampleSkillId && entitlement.freeSampleSkillId !== skill.id;

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <BackLink />

        <header className="space-y-2 rounded-[var(--ds-radius-lg)] px-5 py-6 text-center" style={{ background: "var(--ds-surface)" }}>
          <h1 className="text-[1.4rem] font-semibold">{skill.label}</h1>
          <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            {skill.tagline}
          </p>
          <p className="text-xs" style={{ color: "var(--ds-text-muted)" }}>
            {skill.why}
          </p>
        </header>

        {path.length > 0 ? (
          <section aria-label="Milestone path" className="space-y-2">
            <SectionLabel>Your progress</SectionLabel>
            <div className="space-y-1 rounded-[var(--ds-radius-md)] px-4 py-2" style={{ background: "var(--ds-surface)" }}>
              {path.map((milestone, index) => {
                const reached = index < reachedCount;
                const isCurrentTarget = index === reachedCount;
                return (
                  <div key={milestone.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                      style={{
                        background: reached ? "var(--ds-accent)" : "transparent",
                        border: reached ? "none" : `1.5px solid var(--ds-border)`,
                      }}
                    >
                      {reached ? <IconCheck className="h-3.5 w-3.5" style={{ color: "var(--ds-accent-on)" }} /> : null}
                    </span>
                    <span
                      className="text-[0.88rem]"
                      style={{
                        fontWeight: isCurrentTarget ? 600 : 500,
                        color: reached ? "var(--ds-text)" : isCurrentTarget ? "var(--ds-text)" : "var(--ds-text-muted)",
                      }}
                    >
                      {milestone.title}
                    </span>
                    {isCurrentTarget ? (
                      <span className="ml-auto shrink-0 text-[0.68rem] font-semibold uppercase tracking-wide" style={{ color: "var(--ds-accent)" }}>
                        Working toward
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section aria-label="Where you stand" className="space-y-2">
          <SectionLabel>Where you stand</SectionLabel>
          <div className="space-y-2 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
            <ProgressLine
              label="Current phase"
              value={isOngoing ? "Ongoing Practice" : "Core Practice Arc"}
            />
            {!isOngoing ? <ProgressLine label="Current session" value={`${Math.min(enrollment.currentSessionNumber, arc.length)} of ${arc.length}`} /> : null}
            <ProgressLine label="What you've built" value={currentMilestone ? currentMilestone.title : "Just getting started"} />
            <ProgressLine label="Working toward" value={nextMilestone ? nextMilestone.title : isOngoing ? "Continued practice, at your pace" : "Foundation"} />
          </div>
        </section>

        {canStart ? (
          <Link
            href={`/practice/${skill.id}/session`}
            className="ds-tap inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
            style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
          >
            {isNew ? "Start" : "Continue"}
          </Link>
        ) : (
          <div className="space-y-3 rounded-[var(--ds-radius-md)] px-4 py-5 text-center" style={{ background: "var(--ds-surface)" }}>
            <p className="text-sm font-semibold">
              {freeLockedElsewhere && entitlement.freeSampleSkillId
                ? `Your free Practice sessions are with ${practiceSkillMap[entitlement.freeSampleSkillId].label}.`
                : "Ready to keep building?"}
            </p>
            <p className="text-xs" style={{ color: "var(--ds-text-secondary)" }}>
              {freeLockedElsewhere
                ? "Inner Pause Pass unlocks every skill, including this one."
                : "You've completed the free preview of the real Practice method."}
            </p>
            <Link
              href="/profile/pass"
              className="ds-tap inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
              style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
            >
              Continue with Inner Pause Pass
            </Link>
          </div>
        )}
      </div>
    </PauseShell>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ds-text-muted)" }}>
      {children}
    </h2>
  );
}

function ProgressLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
        {label}
      </span>
      <span className="text-[0.86rem] font-medium text-right">{value}</span>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/practice"
      className="ds-tap inline-flex items-center gap-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
      style={{ color: "var(--ds-text-secondary)" }}
    >
      <IconChevronRight className="h-3.5 w-3.5" style={{ transform: "scaleX(-1)" }} />
      Practice
    </Link>
  );
}

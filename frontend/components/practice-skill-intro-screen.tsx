"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { IconChevronRight } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { getCoreArc } from "@/lib/practice-content";
import { hasEarnedCoreArcMilestone } from "@/lib/practice-engine";
import { IMPLEMENTED_SKILLS, type PracticeSkill } from "@/lib/practice-skills";
import { ensureEnrollment, listPracticeSessionRecords, type PracticeEnrollment } from "@/lib/practice-storage";

// Practice — Skill Introduction (docs/UX_ARCHITECTURE.md §"Practice"): a
// short orientation, not a hub — one primary action, Start or Continue.
export function PracticeSkillIntroScreen({ skill }: { skill: PracticeSkill }) {
  const [enrollment, setEnrollment] = useState<PracticeEnrollment | null>(null);
  const available = IMPLEMENTED_SKILLS.includes(skill.id);
  const arcLength = getCoreArc(skill.id).length;

  useEffect(() => {
    if (!available) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnrollment(ensureEnrollment(skill.id));
  }, [available, skill.id]);

  if (!available) {
    return (
      <PauseShell>
        <div className="space-y-4 pb-4 pt-2">
          <BackLink />
          <div className="space-y-2 rounded-[var(--ds-radius-md)] px-4 py-6 text-center" style={{ background: "var(--ds-surface)" }}>
            <h1 className="text-[1.3rem] font-semibold">{skill.label}</h1>
            <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
              This practice isn&rsquo;t built yet — {skill.tagline.toLowerCase()}. Coming soon.
            </p>
          </div>
        </div>
      </PauseShell>
    );
  }

  const milestoneEarned = enrollment ? hasEarnedCoreArcMilestone(skill.id, listPracticeSessionRecords(skill.id)) : false;
  const isNew = !enrollment || enrollment.completedSessionNumbers.length === 0;

  return (
    <PauseShell>
      <div className="space-y-5 pb-4 pt-2">
        <BackLink />
        <div className="space-y-3 rounded-[var(--ds-radius-lg)] px-5 py-6 text-center" style={{ background: "var(--ds-surface)" }}>
          <h1 className="text-[1.4rem] font-semibold">{skill.label}</h1>
          <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            {skill.tagline}
          </p>
          {enrollment && enrollment.completedSessionNumbers.length > 0 ? (
            <p className="text-xs" style={{ color: "var(--ds-text-muted)" }}>
              {milestoneEarned
                ? `Core practice complete — continuing, session ${enrollment.currentSessionNumber}`
                : `Session ${enrollment.currentSessionNumber} of ${arcLength}`}
            </p>
          ) : null}

          <Link
            href={`/practice/${skill.id}/session`}
            className="ds-tap mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
            style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
          >
            {isNew ? "Start" : "Continue"}
          </Link>
        </div>
      </div>
    </PauseShell>
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

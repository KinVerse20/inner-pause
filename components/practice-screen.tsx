"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { IconChevronRight } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { getCoreArc } from "@/lib/practice-content";
import { hasEarnedCoreArcMilestone } from "@/lib/practice-engine";
import { getPracticeEntitlement, type PracticeEntitlement } from "@/lib/practice-entitlement";
import { practiceSkills, type PracticeSkillId } from "@/lib/practice-skills";
import { listEnrollments, listPracticeSessionRecords, type PracticeEnrollment } from "@/lib/practice-storage";

type DiscoveryLens = "for-you" | "explore";

function progressLabel(skillId: PracticeSkillId, enrollment: PracticeEnrollment | undefined): string | null {
  if (!enrollment || enrollment.completedSessionNumbers.length === 0) return null;
  const arcLength = getCoreArc(skillId).length;
  const milestoneEarned = hasEarnedCoreArcMilestone(skillId, listPracticeSessionRecords(skillId));
  if (milestoneEarned) return "Foundation built — Ongoing Practice";
  return `Session ${enrollment.currentSessionNumber} of ${arcLength}`;
}

// Practice Discovery (docs/UX_ARCHITECTURE.md §"Practice"): For You and
// Explore are two lenses on the same seven real skills — all authored,
// none "Coming soon" (Practice Completion pass §2). For You stays
// deterministic: continue whatever's already in progress, or point at
// Explore when there's nothing to go on yet — no recommendation logic to
// build.
export function PracticeScreen() {
  const [lens, setLens] = useState<DiscoveryLens>("for-you");
  const [enrollments, setEnrollments] = useState<PracticeEnrollment[]>([]);
  const [entitlement, setEntitlement] = useState<PracticeEntitlement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnrollments(listEnrollments());
    setEntitlement(getPracticeEntitlement());
  }, []);

  const enrollmentFor = (skillId: PracticeSkillId) => enrollments.find((item) => item.skillId === skillId);
  const mostRecent = [...enrollments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const forYouSkill = mostRecent ? practiceSkills.find((skill) => skill.id === mostRecent.skillId) : undefined;

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <header>
          <h1 className="text-[1.4rem] font-semibold leading-tight tracking-[-0.01em]">Practice</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            Ongoing, skill by skill — not a course with an end date.
          </p>
        </header>

        <div className="inline-flex rounded-full p-1" style={{ background: "var(--ds-surface)" }}>
          {(["for-you", "explore"] as DiscoveryLens[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLens(item)}
              aria-pressed={lens === item}
              className="ds-tap inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              style={{
                background: lens === item ? "var(--ds-accent)" : "transparent",
                color: lens === item ? "var(--ds-accent-on)" : "var(--ds-text-secondary)",
              }}
            >
              {item === "for-you" ? "For You" : "Explore"}
            </button>
          ))}
        </div>

        {lens === "for-you" ? (
          <section aria-label="Recommended for you">
            {forYouSkill ? (
              <Link
                href={`/practice/${forYouSkill.id}`}
                className="ds-tap flex items-center justify-between gap-3 rounded-[var(--ds-radius-md)] px-4 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ background: "var(--ds-accent-soft)" }}
              >
                <span className="min-w-0">
                  <span className="block text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: "var(--ds-accent)" }}>
                    Continue
                  </span>
                  <span className="mt-0.5 block text-[1.05rem] font-semibold">{forYouSkill.label}</span>
                  <span className="mt-0.5 block text-[0.8rem]" style={{ color: "var(--ds-text-secondary)" }}>
                    {progressLabel(forYouSkill.id, mostRecent) ?? forYouSkill.tagline}
                  </span>
                </span>
                <IconChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--ds-text-muted)" }} />
              </Link>
            ) : (
              <div className="space-y-3 rounded-[var(--ds-radius-md)] px-4 py-5 text-center" style={{ background: "var(--ds-surface)" }}>
                <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
                  Once you start practicing a skill, you&rsquo;ll pick up right here next time.
                </p>
                <button
                  type="button"
                  onClick={() => setLens("explore")}
                  className="ds-tap min-h-10 rounded-full px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                  style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
                >
                  Explore the seven skills
                </button>
              </div>
            )}
          </section>
        ) : (
          <section aria-label="All Practice skills" className="space-y-2.5">
            {practiceSkills.map((skill) => {
              const enrollment = enrollmentFor(skill.id);
              const progress = progressLabel(skill.id, enrollment);
              const freeLockedElsewhere =
                entitlement && !entitlement.hasPass && entitlement.freeSampleSkillId && entitlement.freeSampleSkillId !== skill.id;
              return (
                <Link
                  key={skill.id}
                  href={`/practice/${skill.id}`}
                  className="ds-tap flex items-center justify-between gap-3 rounded-[var(--ds-radius-md)] px-4 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                  style={{ background: "var(--ds-surface)" }}
                >
                  <span className="min-w-0">
                    <span className="block text-[0.98rem] font-semibold">{skill.label}</span>
                    <span className="mt-0.5 block text-[0.8rem]" style={{ color: "var(--ds-text-secondary)" }}>
                      {skill.tagline}
                    </span>
                    <span className="mt-1 block text-[0.72rem]" style={{ color: "var(--ds-text-muted)" }}>
                      {progress ?? (freeLockedElsewhere ? "Available with Inner Pause Pass" : "Not started")}
                    </span>
                  </span>
                  {enrollment && progress ? (
                    <span className="shrink-0 text-[0.7rem] font-semibold" style={{ color: "var(--ds-accent)" }}>
                      Continue
                    </span>
                  ) : (
                    <IconChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--ds-text-muted)" }} />
                  )}
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </PauseShell>
  );
}

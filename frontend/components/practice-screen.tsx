"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { IconChevronRight } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { Stagger, StaggerItem } from "@/components/reveal";
import { getCoreArc } from "@/lib/practice-content";
import { hasEarnedCoreArcMilestone } from "@/lib/practice-engine";
import { getPracticeEntitlement, type PracticeEntitlement } from "@/lib/practice-entitlement";
import { subscribeAppContent } from "@/lib/content-store";
import { getVisiblePracticeSkills, practiceSkills, type PracticeSkill, type PracticeSkillId } from "@/lib/practice-skills";
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
  // Server render and first paint use the shipped seven; the admin-managed
  // list (lib/content-store.ts) replaces it right after mount.
  const [skills, setSkills] = useState<PracticeSkill[]>(practiceSkills);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnrollments(listEnrollments());
    setEntitlement(getPracticeEntitlement());
    const load = () => setSkills(getVisiblePracticeSkills());
    load();
    return subscribeAppContent(load);
  }, []);

  const enrollmentFor = (skillId: PracticeSkillId) => enrollments.find((item) => item.skillId === skillId);
  const mostRecent = [...enrollments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const forYouSkill = mostRecent ? skills.find((skill) => skill.id === mostRecent.skillId) : undefined;

  return (
    <PauseShell>
      <Stagger className="space-y-6 pb-4 pt-2">
        <StaggerItem>
          <header>
            <h1 className="ds-display text-[1.85rem]">Practice</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
              Ongoing, skill by skill — not a course with an end date.
            </p>
          </header>
        </StaggerItem>

        <StaggerItem>
          <div className="inline-flex rounded-full p-1" style={{ background: "var(--ds-accent-soft)" }}>
            {(["for-you", "explore"] as DiscoveryLens[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLens(item)}
                aria-pressed={lens === item}
                className="ds-tap inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{
                  background: lens === item ? "var(--ds-accent)" : "transparent",
                  color: lens === item ? "var(--ds-accent-on)" : "var(--ds-text-secondary)",
                  transition: "background-color 380ms var(--ds-ease), color 380ms var(--ds-ease)",
                }}
              >
                {item === "for-you" ? "For You" : "Explore"}
              </button>
            ))}
          </div>
        </StaggerItem>

        <StaggerItem>
        {lens === "for-you" ? (
          <section aria-label="Recommended for you">
            {forYouSkill ? (
              <Link
                href={`/practice/${forYouSkill.id}`}
                className="ds-card ds-card-lift ds-tap flex items-center justify-between gap-3 px-4 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              >
                <span className="min-w-0">
                  <span className="block text-[0.75rem] font-semibold uppercase tracking-wide" style={{ color: "var(--ds-accent)" }}>
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
                  className="ds-filled ds-tap min-h-10 px-5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                >
                  Explore the skills
                </button>
              </div>
            )}
          </section>
        ) : (
          <section aria-label="All Practice skills" className="space-y-2.5">
            {skills.map((skill) => {
              const enrollment = enrollmentFor(skill.id);
              const progress = progressLabel(skill.id, enrollment);
              const freeLockedElsewhere =
                entitlement && !entitlement.hasPass && entitlement.freeSampleSkillId && entitlement.freeSampleSkillId !== skill.id;
              return (
                <Link
                  key={skill.id}
                  href={`/practice/${skill.id}`}
                  className="ds-card ds-card-lift ds-tap flex items-center justify-between gap-3 px-4 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                >
                  <span className="min-w-0">
                    <span className="block text-[0.98rem] font-semibold">{skill.label}</span>
                    <span className="mt-0.5 block text-[0.8rem]" style={{ color: "var(--ds-text-secondary)" }}>
                      {skill.tagline}
                    </span>
                    <span className="mt-1 block text-[0.75rem]" style={{ color: "var(--ds-text-muted)" }}>
                      {progress ?? (freeLockedElsewhere ? "Available with Inner Pause Pass" : "Not started")}
                    </span>
                  </span>
                  {enrollment && progress ? (
                    <span className="shrink-0 text-[0.75rem] font-semibold" style={{ color: "var(--ds-accent)" }}>
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
        </StaggerItem>
      </Stagger>
    </PauseShell>
  );
}

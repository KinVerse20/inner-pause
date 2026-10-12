import type { PracticeSkillId } from "@/lib/practice-skills";
import type { PracticeSessionRecord } from "@/lib/practice-storage";

// Practice Completion pass §4: milestones communicate development, never a
// streak/badge/point total. Each skill gets an authored path of meaningful
// stages, not a single end-of-arc flag — but the *final* stage in every
// path always mirrors lib/practice-engine.ts's existing
// `hasEarnedCoreArcMilestone` (real, demonstrated practice across the whole
// arc), so this is a richer view onto the same engine signal, not a second
// one (getMilestoneProgress below).
export interface Milestone {
  id: string;
  title: string;
  /** Engaged (real-response) completed sessions needed to reach this stage. */
  atEngagedSessions: number;
}

export const MILESTONE_PATHS: Record<PracticeSkillId, Milestone[]> = {
  confidence: [
    { id: "foundation", title: "Foundation", atEngagedSessions: 1 },
    { id: "speaking-up", title: "Speaking Up", atEngagedSessions: 3 },
    { id: "trusting-yourself", title: "Trusting Yourself", atEngagedSessions: 4 },
    { id: "confidence-in-real-life", title: "Confidence in Real Life", atEngagedSessions: 5 },
  ],
  "self-trust": [
    { id: "foundation", title: "Foundation", atEngagedSessions: 1 },
    { id: "your-own-read", title: "Your Own Read", atEngagedSessions: 2 },
    { id: "deciding-alone", title: "Deciding Alone", atEngagedSessions: 3 },
    { id: "trusting-yourself", title: "Trusting Yourself", atEngagedSessions: 4 },
  ],
  uncertainty: [
    { id: "foundation", title: "Foundation", atEngagedSessions: 1 },
    { id: "sitting-with-it", title: "Sitting With It", atEngagedSessions: 2 },
    { id: "moving-anyway", title: "Moving Anyway", atEngagedSessions: 3 },
    { id: "steady-in-the-unclear", title: "Steady in the Unclear", atEngagedSessions: 4 },
  ],
  "emotional-regulation": [
    { id: "foundation", title: "Foundation", atEngagedSessions: 1 },
    { id: "naming-it", title: "Naming It", atEngagedSessions: 2 },
    { id: "the-pause", title: "The Pause", atEngagedSessions: 3 },
    { id: "steady-through-the-wave", title: "Steady Through the Wave", atEngagedSessions: 4 },
  ],
  "letting-go": [
    { id: "foundation", title: "Foundation", atEngagedSessions: 1 },
    { id: "naming-the-weight", title: "Naming the Weight", atEngagedSessions: 2 },
    { id: "setting-down", title: "Setting Down", atEngagedSessions: 3 },
    { id: "lighter", title: "Lighter", atEngagedSessions: 4 },
  ],
  presence: [
    { id: "foundation", title: "Foundation", atEngagedSessions: 1 },
    { id: "noticing", title: "Noticing", atEngagedSessions: 2 },
    { id: "coming-back", title: "Coming Back", atEngagedSessions: 3 },
    { id: "here", title: "Here", atEngagedSessions: 4 },
  ],
  "self-compassion": [
    { id: "foundation", title: "Foundation", atEngagedSessions: 1 },
    { id: "a-kinder-voice", title: "A Kinder Voice", atEngagedSessions: 2 },
    { id: "permission-to-rest", title: "Permission to Rest", atEngagedSessions: 3 },
    { id: "gentler-with-yourself", title: "Gentler With Yourself", atEngagedSessions: 4 },
  ],
};

// A session counts toward milestone progress only if it was genuinely
// engaged with, not merely opened (Practice Completion pass §14/§4) — the
// same real-response signal lib/practice-engine.ts's
// `hasEarnedCoreArcMilestone` already uses.
export function countEngagedSessions(records: PracticeSessionRecord[]): number {
  return records.filter((record) => Boolean(record.completedAt) && (Boolean(record.activityResponse?.trim()) || Boolean(record.returnText?.trim()))).length;
}

export interface MilestoneProgress {
  path: Milestone[];
  reachedCount: number;
}

export function getMilestoneProgress(
  skillId: PracticeSkillId,
  records: PracticeSessionRecord[],
  arcMilestoneEarned: boolean,
): MilestoneProgress {
  const path = MILESTONE_PATHS[skillId] ?? [];
  const engaged = countEngagedSessions(records);
  let reachedCount = path.filter((milestone) => engaged >= milestone.atEngagedSessions).length;

  // The last stage in the path is the Core Arc milestone itself — always
  // deferred to the engine's own authoritative check rather than
  // recomputed here, so the two can never quietly disagree.
  if (path.length > 0) {
    const reachesLastByCount = reachedCount >= path.length;
    if (arcMilestoneEarned && !reachesLastByCount) reachedCount = path.length;
    if (!arcMilestoneEarned && reachesLastByCount) reachedCount = path.length - 1;
  }

  return { path, reachedCount };
}

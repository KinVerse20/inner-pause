import {
  CHECK_IN_CONTENT,
  SKILL_ARRIVAL_GUIDANCE,
  SKILL_DEFAULT_CATEGORY,
  getCoreArc,
  getOngoingPool,
  type CheckInTier,
  type PracticeActivity,
  type PracticeSessionContent,
} from "@/lib/practice-content";
import type { PauseCategoryId } from "@/lib/pause-categories";
import { composeRightNowPause, type PauseDefinition } from "@/lib/pause-engine";
import { practiceSkillMap, type PracticeSkillId } from "@/lib/practice-skills";
import type { PracticeSessionRecord } from "@/lib/practice-storage";
import { buildThemePlaybackCues } from "@/lib/session-content";

// Practice reuses the Core Pause engine exactly as Big Moments does
// (lib/big-moment-engine.ts) — composeRightNowPause resolves the sound
// framework, only title/duration/arrival copy are overridden. No second
// audio/session engine (this slice's brief §5).

// docs/PRODUCT_FLOW.md §20's fixed checkpoints, then a deterministic
// recurring cadence within the 10-15 range the doc allows.
const ONGOING_CHECKPOINT_CADENCE = 12;

export function getCheckpointTier(sessionNumber: number): CheckInTier | null {
  if (sessionNumber === 1) return "fit";
  if (sessionNumber === 5) return "early-signal";
  if (sessionNumber === 10) return "progress";
  if (sessionNumber === 15) return "adaptation";
  if (sessionNumber > 15 && (sessionNumber - 15) % ONGOING_CHECKPOINT_CADENCE === 0) {
    const cycle = (sessionNumber - 15) / ONGOING_CHECKPOINT_CADENCE;
    return cycle % 2 === 1 ? "early-signal" : "progress";
  }
  return null;
}

export function getCheckInContent(tier: CheckInTier) {
  return CHECK_IN_CONTENT[tier];
}

// Resolves what a given session number actually is: an authored Core Arc
// session while content remains, otherwise a reusable Ongoing Practice
// activity (docs/PRODUCT_FLOW.md §18) — deterministic, cycling through the
// pool rather than repeating the same one indefinitely.
export interface ResolvedPracticeSession {
  sessionNumber: number;
  phase: "core-arc" | "ongoing";
  title: string;
  arrivalGuidance: string[];
  categoryId: PauseCategoryId;
  durationSeconds: number;
  activity: PracticeActivity;
}

const ONGOING_DURATION_SECONDS = 6 * 60;

export function resolvePracticeSession(skillId: PracticeSkillId, sessionNumber: number): ResolvedPracticeSession | null {
  const arc = getCoreArc(skillId);
  const authored: PracticeSessionContent | undefined = arc[sessionNumber - 1];
  if (authored) {
    return {
      sessionNumber,
      phase: "core-arc",
      title: authored.title,
      arrivalGuidance: authored.arrivalGuidance,
      categoryId: authored.categoryId,
      durationSeconds: authored.durationSeconds,
      activity: authored.activity,
    };
  }

  const pool = getOngoingPool(skillId);
  if (pool.length === 0) return null;
  const activity = pool[(sessionNumber - arc.length - 1) % pool.length];
  return {
    sessionNumber,
    phase: "ongoing",
    title: `${practiceSkillMap[skillId].label} — Continued Practice`,
    // Skill-specific, not a generic shared line (Practice Completion pass
    // §8) — the same arrival copy the Core Arc's own sessions default to.
    arrivalGuidance: SKILL_ARRIVAL_GUIDANCE[skillId],
    categoryId: SKILL_DEFAULT_CATEGORY[skillId],
    durationSeconds: ONGOING_DURATION_SECONDS,
    activity,
  };
}

export function composePracticeSessionPause(
  skillId: PracticeSkillId,
  resolved: ResolvedPracticeSession,
  returnTo: string,
): PauseDefinition {
  const base = composeRightNowPause(resolved.categoryId);
  return {
    ...base,
    pauseType: "practice",
    title: `${practiceSkillMap[skillId].label} — ${resolved.title}`,
    durationSeconds: resolved.durationSeconds,
    // The session's own Arrival + "I'm ready" (components/practice-session-screen.tsx)
    // already served Arrive's purpose (docs/PRODUCT_FLOW.md §18's single
    // Arrive -> Tell -> Pause -> Practice -> Return sequence) — the Pause
    // itself skips straight to playback rather than arriving twice, the
    // same instant-transition mechanism Big Moments — During uses.
    requiresArrive: false,
    arrivalGuidance: [],
    // Skill-toned playback content (docs/PRODUCT_FLOW.md §18), not the
    // underlying Right Now category's cues — e.g. a Presence session reads
    // as Presence, not as whichever category it happens to be mapped to.
    playbackCues: buildThemePlaybackCues(skillId, base.chakraName, base.frequencyLabel),
    returnTo,
  };
}

// A milestone is earned, not just reached: the Core Arc must be fully
// completed AND meaningfully engaged with (a real activity or Return
// response on most sessions) — completion alone is not equivalent to a
// streak (this slice's brief §10/§13).
const MILESTONE_ENGAGEMENT_RATIO = 0.6;

export function hasEarnedCoreArcMilestone(skillId: PracticeSkillId, records: PracticeSessionRecord[]): boolean {
  const arc = getCoreArc(skillId);
  if (arc.length === 0) return false;
  const coreRecords = records.filter((record) => record.skillId === skillId && record.sessionNumber <= arc.length && record.completedAt);
  if (coreRecords.length < arc.length) return false;
  const engaged = coreRecords.filter((record) => Boolean(record.activityResponse?.trim()) || Boolean(record.returnText?.trim())).length;
  return engaged >= Math.ceil(arc.length * MILESTONE_ENGAGEMENT_RATIO);
}

export function isCoreArcExhausted(skillId: PracticeSkillId, sessionNumber: number): boolean {
  const arc = getCoreArc(skillId);
  return arc.length > 0 && sessionNumber > arc.length;
}

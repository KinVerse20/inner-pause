import { hasActivePass } from "@/lib/entitlements";
import type { PracticeSkillId } from "@/lib/practice-skills";
import { listPracticeSessionRecords } from "@/lib/practice-storage";

// Free Practice (docs/PRODUCT_FLOW.md §36, locked): exactly two Practice
// sessions total, from one chosen skill — never per-skill, never a
// rotating sample. Counts every started session (not just completed ones)
// across every skill combined, so a free user can't dodge the cap by
// abandoning and restarting.
export const FREE_PRACTICE_SESSION_LIMIT = 2;

// The skill the free sample is "locked" to: whichever skill produced the
// very first Practice session record, by start time. Undefined until a
// free user has actually started a session anywhere (browsing skills or
// merely enrolling doesn't consume anything — only starting playback does).
export function getFreeSampleSkillId(): PracticeSkillId | undefined {
  const records = listPracticeSessionRecords();
  if (records.length === 0) return undefined;
  const earliest = [...records].sort((a, b) => a.startedAt.localeCompare(b.startedAt))[0];
  return earliest.skillId;
}

export interface PracticeEntitlement {
  hasPass: boolean;
  freeSessionsUsed: number;
  freeSampleSkillId?: PracticeSkillId;
}

export function getPracticeEntitlement(): PracticeEntitlement {
  return {
    hasPass: hasActivePass(),
    freeSessionsUsed: listPracticeSessionRecords().length,
    freeSampleSkillId: getFreeSampleSkillId(),
  };
}

// Whether a *new* session (not resuming one already in progress) can start
// for this skill right now. Pass holders are always allowed; free users are
// allowed only on their locked sample skill (or freely on the very first
// skill they ever try), and only for the first two sessions total.
export function canStartNewPracticeSession(skillId: PracticeSkillId): boolean {
  const entitlement = getPracticeEntitlement();
  if (entitlement.hasPass) return true;
  if (entitlement.freeSampleSkillId && entitlement.freeSampleSkillId !== skillId) return false;
  return entitlement.freeSessionsUsed < FREE_PRACTICE_SESSION_LIMIT;
}

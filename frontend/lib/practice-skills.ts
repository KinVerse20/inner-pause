import { DEFAULT_SKILLS, isBuiltInSkillId, type BuiltInSkillId } from "@inner-pause/shared";

import { getSkills } from "@/lib/content-store";

// Practice skills (courses). The seven locked skills (docs/PRODUCT_FLOW.md
// §17) ship with the app; admins can edit them and add their own
// (/admin → Courses), all stored as records in the content store. Deliberately
// NOT lib/practice-paths.ts's legacy 7-chakra/10-skill combined-path model.

export type { BuiltInSkillId };
export { isBuiltInSkillId };

/** Any course id — one of the original seven or an admin-created one. */
export type PracticeSkillId = string;

export interface PracticeSkill {
  id: PracticeSkillId;
  label: string;
  tagline: string;
  /** One honest sentence on why this skill is worth building (Practice Completion pass §2). */
  why: string;
  builtIn: boolean;
  hidden: boolean;
}

const toSkill = ({ id, label, tagline, why, builtIn, hidden }: PracticeSkill): PracticeSkill => ({ id, label, tagline, why, builtIn, hidden });

/** The seven original skills as shipped — the fallback before content loads, and the server render. */
export const practiceSkills: PracticeSkill[] = DEFAULT_SKILLS.map(toSkill);

/** Every course, in admin order, including hidden ones. */
export function getPracticeSkills(): PracticeSkill[] {
  return getSkills().map(toSkill);
}

/** The courses Practice lists. */
export function getVisiblePracticeSkills(): PracticeSkill[] {
  return getPracticeSkills().filter((skill) => !skill.hidden);
}

/**
 * One course by id, hidden or not. The originals always resolve, so a
 * user's history with them never loses its name.
 */
export function getPracticeSkill(id: PracticeSkillId): PracticeSkill | undefined {
  return getPracticeSkills().find((skill) => skill.id === id) ?? practiceSkills.find((skill) => skill.id === id);
}

/** A course's name for labels — still readable if the course was later deleted. */
export function skillLabel(id: PracticeSkillId): string {
  return getPracticeSkill(id)?.label ?? "Practice";
}

// All seven original skills are real, authored destinations (Practice
// Completion pass §2/§20) — kept as an explicit export, not inlined at each
// call site, so a future skill added without content yet still has one
// place to gate on (docs/UX_ARCHITECTURE.md §13's "No Practice yet").
export const IMPLEMENTED_SKILLS: PracticeSkillId[] = practiceSkills.map((skill) => skill.id);

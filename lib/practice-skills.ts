// The seven locked Practice skills (docs/PRODUCT_FLOW.md §17). Deliberately
// NOT lib/practice-paths.ts's legacy 7-chakra/10-skill combined-path model —
// that predates the current locked product definition (wrong skill count,
// wrong names, sequential chakra-unlock semantics the current docs don't
// describe). This is the skill-agnostic catalog the new Practice engine is
// built against.
export type PracticeSkillId =
  | "confidence"
  | "self-trust"
  | "uncertainty"
  | "emotional-regulation"
  | "letting-go"
  | "presence"
  | "self-compassion";

export interface PracticeSkill {
  id: PracticeSkillId;
  label: string;
  tagline: string;
  /** One honest sentence on why this skill is worth building (Practice Completion pass §2). */
  why: string;
}

export const practiceSkills: PracticeSkill[] = [
  {
    id: "confidence",
    label: "Confidence",
    tagline: "Build inner strength you can carry into real moments",
    why: "Self-doubt tends to show up right when it matters most. This helps you trust your own voice in those moments.",
  },
  {
    id: "self-trust",
    label: "Self-Trust",
    tagline: "Learn to rely on your own judgment",
    why: "Constantly checking with others for permission keeps you from finding out what you actually think.",
  },
  {
    id: "uncertainty",
    label: "Uncertainty",
    tagline: "Find steadiness when the way forward isn't clear",
    why: "Waiting for certainty often costs more than moving without it.",
  },
  {
    id: "emotional-regulation",
    label: "Emotional Regulation",
    tagline: "Meet strong feelings without being swept away",
    why: "Strong feelings tend to pass faster when you can meet them, instead of being carried off by them.",
  },
  {
    id: "letting-go",
    label: "Letting Go",
    tagline: "Release what you're still holding",
    why: "Carrying what's already finished leaves less room for what's next.",
  },
  {
    id: "presence",
    label: "Presence",
    tagline: "Practice being fully here",
    why: "Most of what you're looking for is already happening, if you're actually here for it.",
  },
  {
    id: "self-compassion",
    label: "Self-Compassion",
    tagline: "Meet yourself with the kindness you'd offer someone else",
    why: "You'll speak to yourself more than anyone else ever will, so it's worth learning how.",
  },
];

export const practiceSkillMap: Record<PracticeSkillId, PracticeSkill> = Object.fromEntries(
  practiceSkills.map((skill) => [skill.id, skill]),
) as Record<PracticeSkillId, PracticeSkill>;

export function isPracticeSkillId(value: string): value is PracticeSkillId {
  return value in practiceSkillMap;
}

// All seven skills are real, authored destinations (Practice Completion
// pass §2/§20) — kept as an explicit export, not inlined at each call site,
// so a future skill added without content yet still has one place to gate
// on, matching docs/UX_ARCHITECTURE.md §13's "No Practice yet" pattern.
export const IMPLEMENTED_SKILLS: PracticeSkillId[] = practiceSkills.map((skill) => skill.id);

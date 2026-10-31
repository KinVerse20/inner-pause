import { z } from "zod";

import { courseSchema } from "./content";

// Practice courses (skills), as admin-managed records (/admin → Courses).
// The seven original skills are seeded into the database on first read and
// stay editable; admins can add their own. An original's `course` may be
// null, meaning "the course built into the app" — so its authored sessions
// keep working without being copied into the database. Custom courses
// always carry their own.

export const BUILT_IN_SKILL_IDS = [
  "confidence",
  "self-trust",
  "uncertainty",
  "emotional-regulation",
  "letting-go",
  "presence",
  "self-compassion",
] as const;
export type BuiltInSkillId = (typeof BUILT_IN_SKILL_IDS)[number];

export const MAX_SKILLS = 24;

export const skillInputSchema = z.object({
  label: z.string().trim().min(1).max(40),
  tagline: z.string().trim().min(1).max(100),
  /** One honest sentence on why the skill is worth building. */
  why: z.string().trim().max(240),
  hidden: z.boolean(),
  /** Sessions + milestone path. Null only on an original: use its built-in course. */
  course: courseSchema.nullable(),
});

export const skillSchema = skillInputSchema.extend({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  builtIn: z.boolean(),
});

/** A full reordering of the courses: every id, exactly once. */
export const skillOrderSchema = z.object({ ids: z.array(z.string()).max(MAX_SKILLS) });

export type SkillInput = z.infer<typeof skillInputSchema>;
export type SkillDefinition = z.infer<typeof skillSchema>;

/** The seven original skills, exactly as the app shipped them. */
export const DEFAULT_SKILLS: SkillDefinition[] = [
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
].map((skill) => ({ ...skill, builtIn: true, hidden: false, course: null }));

export function isBuiltInSkillId(id: string): id is BuiltInSkillId {
  return (BUILT_IN_SKILL_IDS as readonly string[]).includes(id);
}

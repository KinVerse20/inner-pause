import { z } from "zod";

import type { CardDefinition, CardSound } from "./cards";
import type { SkillDefinition } from "./skills";
import { PAUSE_CATEGORY_IDS } from "./pause-categories";

// Admin-managed content (the /admin screen): Home's cards (cards.ts),
// Practice courses (skills.ts) and the shapes they share. When the content
// API is unreachable the app falls back to the content built into it, so
// the product never depends on it being up.

export const PRACTICE_ACTIVITY_TYPES = [
  "reflection",
  "observation",
  "behavioural-rep",
  "communication-action",
  "reframing",
  "decision-exercise",
] as const;

const pauseCategoryIdSchema = z.enum(PAUSE_CATEGORY_IDS);

export const practiceActivitySchema = z.object({
  type: z.enum(PRACTICE_ACTIVITY_TYPES),
  prompt: z.string().trim().min(1).max(1000),
  realWorldRep: z.string().trim().max(300).optional(),
});

export const practiceSessionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  arrivalGuidance: z.array(z.string().trim().min(1).max(200)).min(1).max(4),
  categoryId: pauseCategoryIdSchema,
  durationSeconds: z.number().int().min(60).max(3600),
  activity: practiceActivitySchema,
});

export const milestoneSchema = z.object({
  id: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(80),
  atEngagedSessions: z.number().int().min(1).max(100),
});

/** One Practice skill's authored Core Arc plus its milestone path. */
export const courseSchema = z
  .object({
    sessions: z.array(practiceSessionSchema).min(1).max(50),
    milestones: z.array(milestoneSchema).max(12),
  })
  .refine(
    (course) => course.milestones.every((m, i, all) => i === 0 || m.atEngagedSessions > all[i - 1].atEngagedSessions),
    { message: "Milestones must need an increasing number of sessions.", path: ["milestones"] },
  );

export type PracticeActivityTypeId = (typeof PRACTICE_ACTIVITY_TYPES)[number];
export type CourseContent = z.infer<typeof courseSchema>;
export type CourseSession = z.infer<typeof practiceSessionSchema>;
export type CourseMilestone = z.infer<typeof milestoneSchema>;

/** Where the server is with a sound's rendered files (backend/src/render-store.ts). */
export type SoundRenderStatus = "ready" | "pending" | "failed";

/** A card's sound, resolved to playable URLs for `GET /api/content`. */
export interface PublicCardSound extends CardSound {
  /** The original upload, as is. */
  url: string;
  name: string;
  description: string;
  coverUrl: string | null;
  /**
   * The sound rendered on the server: tuned to this card's frequency,
   * levelled, looped seamlessly, with this card's volume applied. Null
   * until ready; the player tunes the original live meanwhile.
   */
  tunedUrl: string | null;
  /** The same rendering without tuning, for when Frequency is off. */
  plainUrl: string | null;
  /** Status of this card's tuned rendering. */
  renderStatus: SoundRenderStatus;
  /**
   * Loudness correction (dB) that brings the original to the rendered
   * level, so live playback matches the rendered files. 0 until analysed.
   */
  gainDb: number;
}

export interface PublicCard extends Omit<CardDefinition, "sounds"> {
  sounds: PublicCardSound[];
}

export interface PublicAppContent {
  /** Every card in Home order, including hidden ones (the app filters). */
  cards: PublicCard[];
  /** Every Practice course, in display order, including hidden ones. */
  skills: SkillDefinition[];
  updatedAt: string | null;
}

/** One server rendering of a library sound, for the admin screen. */
export interface SoundRenderInfo {
  /** The frequency it's tuned to; null for the untuned (plain) one. */
  frequencyHz: number | null;
  volume: number;
  status: "pending" | "rendering" | "ready" | "failed";
  /** 0–1. */
  progress: number;
  error: string | null;
  /** The file, once ready. */
  url: string | null;
  /** File size in bytes, once ready. */
  size: number | null;
  durationSeconds: number | null;
  /** Integrated loudness of the file (LUFS), once ready. */
  loudnessLufs: number | null;
  /** e.g. "AAC 256 kbps · 48 kHz". */
  format: string;
  /** Labels of the cards that play this exact file. */
  cards: string[];
}

/** A sound in the admin library. */
export interface SoundAsset {
  id: string;
  name: string;
  /** One short line shown on the sound's card, e.g. "Slow water over stones". */
  description: string;
  coverUrl: string | null;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
  /** Its renderings (listed for the admin library only). */
  renders?: SoundRenderInfo[];
}

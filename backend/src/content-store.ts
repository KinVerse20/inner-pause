import {
  DEFAULT_CARDS,
  DEFAULT_SKILLS,
  type CardDefinition,
  type CardSound,
  type CourseContent,
  type SkillDefinition,
} from "@inner-pause/shared";
import type { Collection } from "mongodb";

import { getDb } from "./mongo";

// A single document holds every admin-managed record. The content is small
// (a couple of dozen cards and courses), so one document keeps reads to a
// single round trip and writes atomic.
const CONTENT_ID = "main";

export interface ContentDocument {
  _id: string;
  /** Home's cards, in display order. Seeded from DEFAULT_CARDS on first read. */
  cards?: CardDefinition[];
  /** Practice courses, in display order. Seeded from DEFAULT_SKILLS on first read. */
  skills?: SkillDefinition[];
  /** Legacy: per-card sounds from before cards were records. Migrated into `cards`. */
  cardSounds?: Record<string, CardSound | CardSound[] | undefined>;
  /** Legacy: course overrides from before courses were records. Migrated into `skills`. */
  courses?: Record<string, CourseContent | undefined>;
  updatedAt: Date | null;
}

export interface Content {
  cards: CardDefinition[];
  skills: SkillDefinition[];
  updatedAt: Date | null;
}

async function contentCollection(): Promise<Collection<ContentDocument>> {
  return (await getDb()).collection<ContentDocument>("app_content");
}

// The original cards and courses become database records the first time
// content is read, carrying over anything saved in older formats (card
// sounds, then course overrides) — so nothing an admin set up is lost.
function seedCards(legacy: ContentDocument["cardSounds"]): CardDefinition[] {
  return DEFAULT_CARDS.map((card) => {
    const saved = legacy?.[card.id];
    const sounds = Array.isArray(saved) ? saved : saved ? [saved] : [];
    return { ...card, sounds };
  });
}

function seedSkills(legacy: ContentDocument["courses"]): SkillDefinition[] {
  return DEFAULT_SKILLS.map((skill) => ({ ...skill, course: legacy?.[skill.id] ?? null }));
}

export async function readContent(): Promise<Content> {
  const collection = await contentCollection();
  const doc = await collection.findOne({ _id: CONTENT_ID });

  // Cards saved before custom frequencies existed have no field: they keep
  // their chakra's frequency.
  let cards = doc?.cards?.map((card) => ({ ...card, frequencyHz: card.frequencyHz ?? null }));
  let skills = doc?.skills;
  const seed: Partial<ContentDocument> = {};
  if (!cards) seed.cards = cards = seedCards(doc?.cardSounds);
  if (!skills) seed.skills = skills = seedSkills(doc?.courses);

  if (Object.keys(seed).length) {
    await collection.updateOne(
      { _id: CONTENT_ID },
      {
        $set: seed,
        $unset: { ...(seed.cards ? { cardSounds: "" as const } : {}), ...(seed.skills ? { courses: "" as const } : {}) },
        $setOnInsert: { updatedAt: null },
      },
      { upsert: true },
    );
  }
  return { cards, skills, updatedAt: doc?.updatedAt ?? null };
}

const cardListeners = new Set<() => void>();

/** Called after every card write (backend/src/render-store.ts re-renders sounds). */
export function onCardsWritten(listener: () => void) {
  cardListeners.add(listener);
}

export async function writeCards(cards: CardDefinition[]) {
  await (await contentCollection()).updateOne({ _id: CONTENT_ID }, { $set: { cards, updatedAt: new Date() } }, { upsert: true });
  for (const listener of cardListeners) listener();
}

export async function writeSkills(skills: SkillDefinition[]) {
  await (await contentCollection()).updateOne({ _id: CONTENT_ID }, { $set: { skills, updatedAt: new Date() } }, { upsert: true });
}

/** Removes a deleted sound from every card that listed it. */
export async function detachSound(soundId: string) {
  const { cards } = await readContent();
  if (!cards.some((card) => card.sounds.some((item) => item.soundId === soundId))) return;
  await writeCards(cards.map((card) => ({ ...card, sounds: card.sounds.filter((item) => item.soundId !== soundId) })));
}

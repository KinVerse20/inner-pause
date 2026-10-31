import {
  DEFAULT_CARDS,
  DEFAULT_SKILLS,
  type CourseContent,
  type PublicAppContent,
  type PublicCard,
  type PublicCardSound,
  type SkillDefinition,
} from "@inner-pause/shared";

import { apiFetch, apiUrl } from "@/lib/api";

// Admin-managed content (backend GET /api/content): Home's cards and
// Practice courses, cached in localStorage so they apply
// instantly on the next load and keep working offline. Until the first
// successful fetch (or if the API is unreachable) the original cards and
// courses are used, so Home and Practice always have something to show.
const STORAGE_KEY = "inner-pause:app-content";
const EVENT_NAME = "inner-pause:app-content-change";

const DEFAULT_PUBLIC_CARDS: PublicCard[] = DEFAULT_CARDS.map((card) => ({ ...card, sounds: [] }));
const EMPTY: PublicAppContent = { cards: DEFAULT_PUBLIC_CARDS, skills: DEFAULT_SKILLS, updatedAt: null };

const isBrowser = () => typeof window !== "undefined";

let cachedRaw: string | null = null;
let cached: PublicAppContent = EMPTY;

function absolutize(card: PublicCard): PublicCard {
  return {
    ...card,
    sounds: card.sounds.map((sound) => ({
      ...sound,
      url: apiUrl(sound.url),
      coverUrl: sound.coverUrl ? apiUrl(sound.coverUrl) : null,
      // Content cached before sounds were rendered has none of these.
      tunedUrl: sound.tunedUrl ? apiUrl(sound.tunedUrl) : null,
      plainUrl: sound.plainUrl ? apiUrl(sound.plainUrl) : null,
      renderStatus: sound.renderStatus ?? "pending",
      gainDb: sound.gainDb ?? 0,
    })),
  };
}

function read(): PublicAppContent {
  if (!isBrowser()) return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    const parsed = raw ? (JSON.parse(raw) as Partial<PublicAppContent>) : {};
    // A cache written before cards became database records has no `cards`
    // — fall back to the originals rather than an empty Home.
    const cards = Array.isArray(parsed.cards) && parsed.cards.length ? parsed.cards : DEFAULT_PUBLIC_CARDS;
    const skills = Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills : DEFAULT_SKILLS;
    cached = { cards: cards.map(absolutize), skills, updatedAt: parsed.updatedAt ?? null };
    return cached;
  } catch {
    return EMPTY;
  }
}

export function getAppContent(): PublicAppContent {
  return read();
}

/** Every card, in Home order, including hidden ones. */
export function getCards(): PublicCard[] {
  return read().cards;
}

/** The cards Home shows. */
export function getVisibleCards(): PublicCard[] {
  return getCards().filter((card) => !card.hidden);
}

/**
 * One card by id. The original six always resolve (to their defaults if
 * the content hasn't loaded), so routing that refers to them never breaks.
 */
export function getCard(cardId: string): PublicCard | undefined {
  return getCards().find((card) => card.id === cardId) ?? DEFAULT_PUBLIC_CARDS.find((card) => card.id === cardId);
}

/** Every sound the admin added to a card, in order, with absolute URLs. */
export function getCardSounds(cardId: string): PublicCardSound[] {
  return getCard(cardId)?.sounds ?? [];
}

/**
 * One sound for a card: the requested one, or the card's default (its
 * first) when none is requested. `null` explicitly means "no sound".
 */
export function getCardSound(cardId: string, soundId?: string | null): PublicCardSound | undefined {
  if (soundId === null) return undefined;
  const sounds = getCardSounds(cardId);
  return soundId ? sounds.find((sound) => sound.soundId === soundId) : sounds[0];
}

/** Every Practice course record, in admin order, including hidden ones. */
export function getSkills(): SkillDefinition[] {
  return read().skills;
}

/**
 * A course's admin-authored sessions and milestones, or undefined when an
 * original course uses its built-in content (lib/practice-content.ts).
 */
export function getCourseOverride(skillId: string): CourseContent | undefined {
  return getSkills().find((skill) => skill.id === skillId)?.course ?? undefined;
}

export async function refreshAppContent(): Promise<PublicAppContent> {
  try {
    const response = await apiFetch("/api/content", { cache: "no-store" });
    if (!response.ok) return read();
    const payload = (await response.json()) as PublicAppContent;
    const raw = JSON.stringify(payload);
    if (isBrowser() && raw !== window.localStorage.getItem(STORAGE_KEY)) {
      window.localStorage.setItem(STORAGE_KEY, raw);
      window.dispatchEvent(new Event(EVENT_NAME));
    }
    return read();
  } catch {
    return read();
  }
}

export function subscribeAppContent(callback: () => void) {
  if (!isBrowser()) return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

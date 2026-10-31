import { mkdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

import { cardFrequencyHz, type CardDefinition } from "@inner-pause/shared";
import type { Collection } from "mongodb";

import { onCardsWritten, readContent } from "./content-store";
import { getDb } from "./mongo";
import { renderSound } from "./renderer";
import { TEMP_DIR, fileStore, removeLocalFile } from "./file-store";
import { findSound, listSounds } from "./sound-store";

// Rendered versions of the sounds on Home's cards (backend/src/renderer.ts).
// Every sound on a card gets two: tuned to that card's frequency, and plain
// (for people who switch Frequency off). Both carry the card's volume, so
// they play as is on devices that can't change a file's volume (iPhone).
// Renders are derived from the cards: whenever cards change, the wanted set
// is recomputed, missing renders are queued and rendered one at a time in
// the background, and ones no card needs any more are removed after a grace
// period (a Pause already playing one keeps working).

/** Bump when renderer.ts's output changes, so every sound is re-rendered. */
export const RENDER_RECIPE = 2;
// Renderings are stored under this key prefix (file-store.ts).
const RENDERS = "renders/";
const STALE_GRACE_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;

export type RenderStatus = "pending" | "rendering" | "ready" | "failed";

export interface RenderDocument {
  /** renderKey(soundId, frequencyHz, volume). */
  _id: string;
  soundId: string;
  /** null = the plain (untuned) rendering. */
  frequencyHz: number | null;
  volume: number;
  recipe: number;
  status: RenderStatus;
  /** 0–1 while rendering. */
  progress?: number;
  attempts: number;
  /** The AAC (.m4a) file. */
  storedAs?: string;
  /** The same rendering as Opus (.webm), for browsers without AAC. */
  storedAsWebm?: string;
  size?: number;
  durationSeconds?: number;
  /** Loudness of the input before levelling (LUFS); null if silent. */
  inputLufs?: number | null;
  error?: string;
  /** Set when no card needs this rendering any more. */
  staleSince?: Date;
  createdAt: Date;
  updatedAt: Date;
}

async function rendersCollection(): Promise<Collection<RenderDocument>> {
  return (await getDb()).collection<RenderDocument>("sound_renders");
}

const roundVolume = (volume: number) => Math.round(volume * 100) / 100;

export function renderKey(soundId: string, frequencyHz: number | null, volume: number) {
  const tuning = frequencyHz === null ? "plain" : String(frequencyHz).replace(".", "_");
  return `${soundId}-${tuning}-v${Math.round(roundVolume(volume) * 100)}-r${RENDER_RECIPE}`;
}

export const isRenderKey = (key: string) => /^[a-f0-9]{24}-(plain|\d+(_\d+)?)-v\d+-r\d+$/.test(key);
/** The AAC file; append "/webm" for the Opus one. */
export const renderUrl = (key: string) => `/api/sounds/renders/${key}`;

/** The two renderings (tuned, plain) of one sound on one card. */
export function cardSoundRenderKeys(card: CardDefinition, soundId: string, volume: number) {
  return { tuned: renderKey(soundId, cardFrequencyHz(card), volume), plain: renderKey(soundId, null, volume) };
}

export async function findRenders(keys: string[]) {
  if (keys.length === 0) return new Map<string, RenderDocument>();
  const docs = await (await rendersCollection()).find({ _id: { $in: keys } }).toArray();
  return new Map(docs.map((doc) => [doc._id, doc]));
}

export async function findRender(key: string) {
  return (await rendersCollection()).findOne({ _id: key });
}

async function removeRender(doc: RenderDocument) {
  await (await rendersCollection()).deleteOne({ _id: doc._id });
  await removeRenderFiles(doc);
}

async function removeRenderFiles(doc: RenderDocument) {
  for (const file of [doc.storedAs, doc.storedAsWebm]) if (file) await fileStore().remove(`${RENDERS}${file}`);
}

/** Current renderings (not stale), for the admin library: what each sound has and how far along it is. */
export async function listRenders() {
  return (await rendersCollection()).find({ staleSince: { $exists: false } }).sort({ createdAt: 1 }).toArray();
}

// The rendering in progress, so deleting its sound can stop it (and release
// the file it has open).
let current: { soundId: string; controller: AbortController } | null = null;

/**
 * Removes every rendering of a sound that's being deleted from the library,
 * stopping one in progress first. Call before deleting the sound's files.
 */
export async function deleteRendersForSound(soundId: string) {
  const collection = await rendersCollection();
  const docs = await collection.find({ soundId }).toArray();
  // Out of the queue first, so it can't start another of them, then stop
  // the one running.
  await collection.deleteMany({ soundId });
  if (current?.soundId === soundId) current.controller.abort();
  for (const doc of docs) await removeRenderFiles(doc);
}

/** Brings the renderings in line with the cards, then renders what's missing. */
export async function syncRenders() {
  const collection = await rendersCollection();
  const [{ cards }, sounds, existing] = await Promise.all([readContent(), listSounds(), collection.find().toArray()]);
  const library = new Set(sounds.map((sound) => sound._id.toString()));

  const wanted = new Map<string, Pick<RenderDocument, "soundId" | "frequencyHz" | "volume">>();
  for (const card of cards) {
    for (const { soundId, volume } of card.sounds) {
      if (!library.has(soundId)) continue;
      const keys = cardSoundRenderKeys(card, soundId, volume);
      wanted.set(keys.tuned, { soundId, frequencyHz: cardFrequencyHz(card), volume: roundVolume(volume) });
      wanted.set(keys.plain, { soundId, frequencyHz: null, volume: roundVolume(volume) });
    }
  }

  const now = new Date();
  for (const doc of existing) {
    if (!library.has(doc.soundId)) {
      await removeRender(doc);
    } else if (!wanted.has(doc._id)) {
      if (!doc.staleSince) await collection.updateOne({ _id: doc._id }, { $set: { staleSince: now } });
      else if (now.getTime() - doc.staleSince.getTime() > STALE_GRACE_MS) await removeRender(doc);
    } else if (doc.staleSince) {
      await collection.updateOne({ _id: doc._id }, { $unset: { staleSince: "" } });
    }
  }

  const known = new Set(existing.map((doc) => doc._id));
  const missing = [...wanted].filter(([key]) => !known.has(key));
  if (missing.length) {
    try {
      await collection.insertMany(
        missing.map(([key, spec]) => ({ _id: key, ...spec, recipe: RENDER_RECIPE, status: "pending", attempts: 0, createdAt: now, updatedAt: now })),
        // Unordered: if an overlapping sync already queued some of these,
        // the rest are still inserted.
        { ordered: false },
      );
    } catch (error) {
      const duplicatesOnly =
        typeof error === "object" && error !== null && "writeErrors" in error &&
        ([] as Array<{ code?: number }>).concat((error as { writeErrors: Array<{ code?: number }> }).writeErrors).every((item) => item.code === 11000);
      if (!duplicatesOnly) throw error;
    }
  }
  void processQueue();
}

let syncTimer: NodeJS.Timeout | undefined;
/** Debounced sync: several card edits in a row cause one pass. */
export function scheduleRenderSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncRenders().catch((error) => console.error("[renders] sync failed:", error instanceof Error ? error.message : error));
  }, 500);
}

let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;
  try {
    const collection = await rendersCollection();
    for (;;) {
      const doc = await collection.findOneAndUpdate(
        { status: "pending" },
        { $set: { status: "rendering", progress: 0, updatedAt: new Date() }, $inc: { attempts: 1 } },
        { sort: { createdAt: 1 }, returnDocument: "after" },
      );
      if (!doc) break;
      // Registered straight away, so a deletion from here on stops it.
      const controller = new AbortController();
      current = { soundId: doc.soundId, controller };
      const sound = await findSound(doc.soundId);
      if (!sound || controller.signal.aborted) {
        await removeRender(doc);
        current = null;
        continue;
      }
      // Rendered in a scratch folder, then handed to the store (this disk or S3).
      await mkdir(TEMP_DIR, { recursive: true });
      const storedAs = `${doc._id}.m4a`;
      const storedAsWebm = `${doc._id}.webm`;
      const output = join(TEMP_DIR, storedAs);
      const webmOutput = join(TEMP_DIR, storedAsWebm);
      const started = Date.now();
      // Progress is saved at most once a second, for the admin screen.
      let savedAt = 0;
      const saveProgress = (fraction: number) => {
        if (Date.now() - savedAt < 1000) return;
        savedAt = Date.now();
        void collection.updateOne({ _id: doc._id, status: "rendering" }, { $set: { progress: Math.round(fraction * 100) / 100 } }).catch(() => {});
      };
      let input: Awaited<ReturnType<ReturnType<typeof fileStore>["localCopy"]>> | null = null;
      try {
        input = await fileStore().localCopy(sound.storedAs);
        const result = await renderSound(
          { input: input.path, output, webmOutput, frequencyHz: doc.frequencyHz, volume: doc.volume },
          controller.signal,
          saveProgress,
        );
        const size = (await stat(output)).size;
        await fileStore().writeFromPath(`${RENDERS}${storedAs}`, output, "audio/mp4");
        await fileStore().writeFromPath(`${RENDERS}${storedAsWebm}`, webmOutput, "audio/webm");
        const saved = await collection.updateOne(
          { _id: doc._id },
          { $set: { status: "ready", progress: 1, storedAs, storedAsWebm, size, durationSeconds: result.durationSeconds, inputLufs: result.inputLufs, updatedAt: new Date() }, $unset: { error: "" } },
        );
        // Removed while rendering (its sound or card went away).
        if (saved.matchedCount === 0) await removeRenderFiles({ ...doc, storedAs, storedAsWebm });
        else console.log(`[renders] ${doc._id} ready in ${((Date.now() - started) / 1000).toFixed(1)}s`);
      } catch (error) {
        // Stopped because its sound was deleted: nothing left to record.
        if (controller.signal.aborted) continue;
        const message = error instanceof Error ? error.message : String(error);
        await collection.updateOne(
          { _id: doc._id },
          { $set: { status: doc.attempts < MAX_ATTEMPTS ? "pending" : "failed", error: message.slice(0, 500), updatedAt: new Date() } },
        );
        console.error(`[renders] ${doc._id} failed (attempt ${doc.attempts}): ${message}`);
        if (doc.attempts < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 2000));
      } finally {
        current = null;
        await input?.release();
        // Whatever is left in the scratch folder after a failure or a stop.
        await removeLocalFile(output);
        await removeLocalFile(webmOutput);
      }
    }
  } finally {
    processing = false;
  }
}

/** Starts background rendering: resumes interrupted work and catches up with the cards. */
export async function startRenderWorker() {
  const collection = await rendersCollection();
  // Interrupted by a restart, or failed before: try again from scratch.
  await collection.updateMany({ status: "rendering" }, { $set: { status: "pending" } });
  await collection.updateMany({ status: "failed" }, { $set: { status: "pending", attempts: 0 } });
  // Nothing is rendering yet, so any file no ready rendering points at is
  // left over (a half-written file from a restart mid-render, say).
  await rm(TEMP_DIR, { recursive: true, force: true }).catch(() => {});
  const kept = new Set((await collection.find({ status: "ready" }).toArray()).flatMap((doc) => [doc.storedAs, doc.storedAsWebm]));
  for (const key of await fileStore().list(RENDERS)) if (!kept.has(key.slice(RENDERS.length))) await fileStore().remove(key);
  onCardsWritten(scheduleRenderSync);
  await syncRenders();
}

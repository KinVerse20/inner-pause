import { extname } from "node:path";

import type { SoundAsset } from "@inner-pause/shared";
import { ObjectId, type Collection } from "mongodb";

import { fileStore } from "./file-store";
import { getDb } from "./mongo";

// Uploaded sound files (and their cover images) live on the backend's
// local disk (backend/uploads), metadata in MongoDB. Local disk is a
// deliberate prototype choice: it works anywhere the backend has a
// persistent filesystem, but files are lost on hosts with ephemeral disks —
// swap this module for object storage (S3, GridFS) before deploying to one
// of those.

// Room for lossless masters: a 10-minute 48 kHz/24-bit stereo WAV is
// about 170 MB. (frontend/next.config.ts's proxyClientMaxBodySize must
// stay above this.)
export const MAX_SOUND_BYTES = 300 * 1024 * 1024;
export const MAX_COVER_BYTES = 5 * 1024 * 1024;
export const MAX_DESCRIPTION_LENGTH = 140;

const AUDIO_EXTENSION_BY_MIME: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/aac": ".aac",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/wave": ".wav",
  "audio/flac": ".flac",
  "audio/x-flac": ".flac",
  "audio/ogg": ".ogg",
  "audio/webm": ".webm",
};

const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const MIME_BY_EXTENSION: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
  ".webm": "audio/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export interface SoundDocument {
  _id: ObjectId;
  name: string;
  description?: string;
  fileName: string;
  storedAs: string;
  mimeType: string;
  size: number;
  coverStoredAs?: string;
  coverMimeType?: string;
  createdAt: Date;
  updatedAt?: Date;
}

async function soundsCollection(): Promise<Collection<SoundDocument>> {
  return (await getDb()).collection<SoundDocument>("sounds");
}

export function soundUrl(id: string) {
  return `/api/sounds/${id}/file`;
}

/** Versioned by update time so a replaced cover is never served stale from cache. */
export function coverUrl(doc: SoundDocument) {
  if (!doc.coverStoredAs) return null;
  return `/api/sounds/${doc._id.toString()}/cover?v=${(doc.updatedAt ?? doc.createdAt).getTime()}`;
}

export function toSoundAsset(doc: SoundDocument): SoundAsset {
  const id = doc._id.toString();
  return {
    id,
    name: doc.name,
    description: doc.description ?? "",
    coverUrl: coverUrl(doc),
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    size: doc.size,
    createdAt: doc.createdAt.toISOString(),
    url: soundUrl(id),
  };
}

function resolveExtension(table: Record<string, string>, mimeType: string, fileName: string): string | null {
  const fromMime = table[mimeType.toLowerCase()];
  if (fromMime) return fromMime;
  const fromName = extname(fileName).toLowerCase().replace(/^\.jpeg$/, ".jpg");
  return Object.values(table).includes(fromName) ? fromName : null;
}

export const resolveAudioExtension = (mimeType: string, fileName: string) =>
  resolveExtension(AUDIO_EXTENSION_BY_MIME, mimeType, fileName);
export const resolveImageExtension = (mimeType: string, fileName: string) =>
  resolveExtension(IMAGE_EXTENSION_BY_MIME, mimeType, fileName);

export interface CoverUpload {
  bytes: Buffer;
  extension: string;
}

async function writeCover(id: ObjectId, cover: CoverUpload) {
  const coverStoredAs = `${id.toString()}-cover-${Date.now()}${cover.extension}`;
  await fileStore().write(coverStoredAs, cover.bytes, MIME_BY_EXTENSION[cover.extension]);
  return { coverStoredAs, coverMimeType: MIME_BY_EXTENSION[cover.extension] };
}

export async function saveSound(input: {
  name: string;
  description: string;
  fileName: string;
  bytes: Buffer;
  extension: string;
  cover?: CoverUpload;
}) {
  const _id = new ObjectId();
  const storedAs = `${_id.toString()}${input.extension}`;
  await fileStore().write(storedAs, input.bytes, MIME_BY_EXTENSION[input.extension]);
  const doc: SoundDocument = {
    _id,
    name: input.name,
    description: input.description,
    fileName: input.fileName,
    storedAs,
    mimeType: MIME_BY_EXTENSION[input.extension],
    size: input.bytes.length,
    ...(input.cover ? await writeCover(_id, input.cover) : {}),
    createdAt: new Date(),
  };
  await (await soundsCollection()).insertOne(doc);
  return doc;
}

export async function updateSound(
  doc: SoundDocument,
  patch: { name?: string; description?: string; cover?: CoverUpload; removeCover?: boolean },
) {
  const next: Partial<SoundDocument> = { updatedAt: new Date() };
  if (patch.name !== undefined) next.name = patch.name;
  if (patch.description !== undefined) next.description = patch.description;

  const oldCover = doc.coverStoredAs;
  if (patch.cover) {
    Object.assign(next, await writeCover(doc._id, patch.cover));
  }
  const unset = patch.removeCover && !patch.cover ? { coverStoredAs: "" as const, coverMimeType: "" as const } : undefined;

  await (await soundsCollection()).updateOne({ _id: doc._id }, { $set: next, ...(unset ? { $unset: unset } : {}) });
  if (oldCover && (patch.cover || patch.removeCover)) await fileStore().remove(oldCover);
  return findSound(doc._id.toString());
}

export async function listSounds() {
  return (await soundsCollection()).find().sort({ createdAt: -1 }).toArray();
}

export async function findSound(id: string) {
  if (!ObjectId.isValid(id)) return null;
  return (await soundsCollection()).findOne({ _id: new ObjectId(id) });
}

export async function findSoundsByIds(ids: string[]) {
  const valid = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (valid.length === 0) return [];
  return (await soundsCollection()).find({ _id: { $in: valid } }).toArray();
}

export async function deleteSound(doc: SoundDocument) {
  await (await soundsCollection()).deleteOne({ _id: doc._id });
  await fileStore().remove(doc.storedAs);
  if (doc.coverStoredAs) await fileStore().remove(doc.coverStoredAs);
}

import { ObjectId, type Collection } from "mongodb";

import { getDb } from "./mongo";

// Card sounds added through the former admin screen: files (and cover
// images) in the file store (file-store.ts), metadata in MongoDB. Read-only
// now: the app streams them (routes/sounds.ts) and the render worker tunes
// them (render-store.ts). New sounds are added straight to storage.

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

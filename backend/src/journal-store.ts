import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import type { Collection } from "mongodb";

import { getDb } from "./mongo";

// The optional private journal backup (You → Data & Privacy). Off unless
// the listener turns it on, and unless JOURNAL_ENCRYPTION_KEY is set: every
// entry is stored encrypted (AES-256-GCM) with the owner's id bound in, so
// a database copy alone reads as nothing, and one account's record can't
// be passed off as another's.

export interface JournalRecord {
  userId: string;
  entryId: string;
  /** The entry's own time, for ordering; not secret. */
  entryCreatedAt: string;
  iv: string;
  tag: string;
  data: string;
  updatedAt: Date;
}

/** The 32-byte key, or null while the backup isn't set up. Generate: `openssl rand -base64 32`. */
function encryptionKey(): Buffer | null {
  const raw = process.env.JOURNAL_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

export const journalBackupAvailable = () => encryptionKey() !== null;

const aad = (userId: string, entryId: string) => Buffer.from(`${userId}:${entryId}`);

export function sealEntry(key: Buffer, userId: string, entryId: string, entry: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad(userId, entryId));
  const data = Buffer.concat([cipher.update(JSON.stringify(entry), "utf8"), cipher.final()]);
  return { iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") };
}

export function openEntry(key: Buffer, record: Pick<JournalRecord, "userId" | "entryId" | "iv" | "tag" | "data">): unknown {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(record.iv, "base64"));
  decipher.setAAD(aad(record.userId, record.entryId));
  decipher.setAuthTag(Buffer.from(record.tag, "base64"));
  const plain = Buffer.concat([decipher.update(Buffer.from(record.data, "base64")), decipher.final()]);
  return JSON.parse(plain.toString("utf8"));
}

let indexesReady = false;

async function records(): Promise<Collection<JournalRecord>> {
  const collection = (await getDb()).collection<JournalRecord>("journal_entries");
  if (!indexesReady) {
    await collection.createIndex({ userId: 1, entryId: 1 }, { unique: true });
    indexesReady = true;
  }
  return collection;
}

function requireKey() {
  const key = encryptionKey();
  if (!key) throw new Error("Journal backup is not set up.");
  return key;
}

export async function saveEntry(userId: string, entry: { id: string; createdAt: string }) {
  const sealed = sealEntry(requireKey(), userId, entry.id, entry);
  await (await records()).updateOne(
    { userId, entryId: entry.id },
    { $set: { userId, entryId: entry.id, entryCreatedAt: entry.createdAt, ...sealed, updatedAt: new Date() } },
    { upsert: true },
  );
}

export async function countEntries(userId: string) {
  return (await records()).countDocuments({ userId });
}

/** Every backed-up entry, oldest first. Ones that won't decrypt (a changed key) are skipped. */
export async function listEntries(userId: string): Promise<unknown[]> {
  const key = requireKey();
  const all = await (await records()).find({ userId }).sort({ entryCreatedAt: 1 }).toArray();
  return all.flatMap((record) => {
    try {
      return [openEntry(key, record)];
    } catch {
      return [];
    }
  });
}

export async function deleteEntry(userId: string, entryId: string) {
  await (await records()).deleteOne({ userId, entryId });
}

export async function deleteAllEntries(userId: string) {
  await (await records()).deleteMany({ userId });
}

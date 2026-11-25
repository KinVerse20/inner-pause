import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";

import { getVerifiedSession } from "../auth/session";
import { invalidBody, readJsonObject } from "../http";
import { countEntries, deleteAllEntries, deleteEntry, journalBackupAvailable, listEntries, saveEntry } from "../journal-store";

// The optional private journal backup (journal-store.ts). The app's journal
// lives on the device (frontend/lib/tell-storage.ts); with the backup on,
// frontend/lib/journal-sync.ts keeps this copy in step.
export const journalRoutes = new Hono();

// One entry at a time, so a request never needs to be big.
journalRoutes.use("*", bodyLimit({ maxSize: 64 * 1024, onError: (c) => c.json({ error: "That entry is too large." }, 413) }));

const MAX_ENTRIES = 10_000;
const MAX_TEXT = 10_000;
const MAX_ENTRY_BYTES = 24_000;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

const optionalId = (value: unknown) => value === undefined || (typeof value === "string" && ID.test(value));

/** A journal entry as the app stores it, checked; or null. */
export function parseJournalEntry(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entry = value as Record<string, unknown>;
  if (typeof entry.id !== "string" || !ID.test(entry.id)) return null;
  if (typeof entry.text !== "string" || entry.text.length === 0 || entry.text.length > MAX_TEXT) return null;
  if (entry.source !== "write" && entry.source !== "speak") return null;
  if (!Array.isArray(entry.chips) || entry.chips.length > 20 || !entry.chips.every((chip) => typeof chip === "string" && chip.length <= 60)) return null;
  if (typeof entry.createdAt !== "string" || Number.isNaN(Date.parse(entry.createdAt))) return null;
  if (!entry.interpretation || typeof entry.interpretation !== "object") return null;
  if (!optionalId(entry.linkedPauseRecordId) || !optionalId(entry.linkedMomentId) || !optionalId(entry.linkedPracticeSessionId)) return null;
  if (entry.momentMode !== undefined && !["before", "during", "after"].includes(entry.momentMode as string)) return null;
  if (Buffer.byteLength(JSON.stringify(entry)) > MAX_ENTRY_BYTES) return null;
  return entry as { id: string; createdAt: string } & Record<string, unknown>;
}

async function signedIn(c: Context) {
  return getVerifiedSession(c);
}

const notSetUp = (c: Context) => c.json({ error: "Journal backup isn't available yet." }, 503);

// Public: whether the backup can be turned on at all.
journalRoutes.get("/config", (c) => c.json({ available: journalBackupAvailable() }));

journalRoutes.get("/", async (c) => {
  const verified = await signedIn(c);
  if (!verified) return c.json({ error: "Authentication required." }, 401);
  if (!journalBackupAvailable()) return notSetUp(c);
  return c.json({ entries: await listEntries(verified.record._id.toString()) });
});

journalRoutes.put("/:id", async (c) => {
  const verified = await signedIn(c);
  if (!verified) return c.json({ error: "Authentication required." }, 401);
  if (!journalBackupAvailable()) return notSetUp(c);
  const body = await readJsonObject(c);
  if (!body) return invalidBody(c);
  const entry = parseJournalEntry(body.entry);
  if (!entry || entry.id !== c.req.param("id")) return c.json({ error: "Invalid journal entry." }, 400);
  const userId = verified.record._id.toString();
  if ((await countEntries(userId)) >= MAX_ENTRIES) return c.json({ error: "Your journal backup is full." }, 413);
  await saveEntry(userId, entry);
  return c.json({ ok: true });
});

journalRoutes.delete("/:id", async (c) => {
  const verified = await signedIn(c);
  if (!verified) return c.json({ error: "Authentication required." }, 401);
  const id = c.req.param("id") ?? "";
  if (!ID.test(id)) return c.json({ error: "Invalid entry." }, 400);
  await deleteEntry(verified.record._id.toString(), id);
  return c.json({ ok: true });
});

// Turning the backup off, or deleting your Journey data: the account copy goes.
journalRoutes.delete("/", async (c) => {
  const verified = await signedIn(c);
  if (!verified) return c.json({ error: "Authentication required." }, 401);
  await deleteAllEntries(verified.record._id.toString());
  return c.json({ ok: true });
});

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { openEntry, sealEntry } from "../src/journal-store.ts";
import { parseJournalEntry } from "../src/routes/journal.ts";
import { createApp } from "../src/app.ts";

const key = crypto.randomBytes(32);
const entry = {
  id: "e1",
  text: "A long walk after work.",
  source: "write",
  chips: ["calm"],
  createdAt: "2026-11-25T12:00:00.000Z",
  interpretation: { status: "confident", primary: null, candidates: [], confidence: 0, method: "deterministic", rationale: "x" },
};

test("a journal entry is unreadable without the key, and bound to its owner", () => {
  const sealed = sealEntry(key, "user-a", "e1", entry);
  assert.ok(!Buffer.from(sealed.data, "base64").toString("utf8").includes("walk"), "ciphertext hides the text");
  assert.deepEqual(openEntry(key, { userId: "user-a", entryId: "e1", ...sealed }), entry);
  assert.throws(() => openEntry(key, { userId: "user-b", entryId: "e1", ...sealed }), "another account can't open it");
  assert.throws(() => openEntry(crypto.randomBytes(32), { userId: "user-a", entryId: "e1", ...sealed }), "another key can't open it");
  const tampered = { ...sealed, data: Buffer.from(Buffer.from(sealed.data, "base64").map((byte, index) => (index === 0 ? byte ^ 1 : byte))).toString("base64") };
  assert.throws(() => openEntry(key, { userId: "user-a", entryId: "e1", ...tampered }), "tampering is caught");
});

test("only journal-shaped entries are accepted", () => {
  assert.ok(parseJournalEntry(entry));
  for (const bad of [
    null,
    { ...entry, id: "../etc" },
    { ...entry, text: "" },
    { ...entry, text: "x".repeat(10_001) },
    { ...entry, source: "email" },
    { ...entry, chips: "calm" },
    { ...entry, createdAt: "yesterday" },
    { ...entry, interpretation: undefined },
    { ...entry, momentMode: "someday" },
    { ...entry, linkedPauseRecordId: "has spaces" },
  ]) assert.equal(parseJournalEntry(bad), null, JSON.stringify(bad)?.slice(0, 60));
});

test("the backup needs a session, and says when it isn't set up", async () => {
  const app = createApp();
  assert.deepEqual(await (await app.request("/api/journal/config")).json(), { available: false });
  for (const [method, path] of [["GET", "/api/journal"], ["PUT", "/api/journal/e1"], ["DELETE", "/api/journal/e1"], ["DELETE", "/api/journal"]]) {
    const response = await app.request(path, { method, body: method === "PUT" ? JSON.stringify({ entry }) : undefined, headers: { "content-type": "application/json" } });
    assert.equal(response.status, 401, `${method} ${path}`);
  }
});

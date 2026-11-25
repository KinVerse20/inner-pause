import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// The journal backup against a real MongoDB (a throwaway one):
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27018/ip-journal-test npm test
const MONGO = process.env.TEST_MONGODB_URI;
const skip = MONGO ? false : "set TEST_MONGODB_URI to a throwaway database";

test("entries are stored encrypted, per account, and removed with it", { skip }, async () => {
  process.env.MONGODB_URI = MONGO;
  process.env.JOURNAL_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
  const { getDb, closeMongo } = await import("../src/mongo.ts");
  const store = await import("../src/journal-store.ts");
  const db = await getDb();
  await db.collection("journal_entries").deleteMany({});
  const entry = (id, text) => ({ id, text, source: "write", chips: [], createdAt: new Date().toISOString(), interpretation: {} });
  try {
    await store.saveEntry("alice", entry("a1", "Alice's quiet morning"));
    await store.saveEntry("alice", entry("a2", "Alice's walk"));
    await store.saveEntry("bob", entry("b1", "Bob's evening"));
    await store.saveEntry("alice", { ...entry("a2", "Alice's walk, edited") });

    const raw = await db.collection("journal_entries").find().toArray();
    assert.equal(raw.length, 3, "an edit replaces, it doesn't add");
    assert.ok(!JSON.stringify(raw).includes("Alice"), "no readable text stored");

    assert.deepEqual((await store.listEntries("alice")).map((item) => item.text).sort(), ["Alice's quiet morning", "Alice's walk, edited"]);
    assert.deepEqual((await store.listEntries("bob")).map((item) => item.text), ["Bob's evening"]);

    await store.deleteEntry("alice", "b1");
    assert.equal(await store.countEntries("bob"), 1, "one account can't delete another's entry");
    await store.deleteAllEntries("alice");
    assert.equal(await store.countEntries("alice"), 0);
    assert.equal(await store.countEntries("bob"), 1);
  } finally {
    await db.collection("journal_entries").deleteMany({});
    await closeMongo();
  }
});

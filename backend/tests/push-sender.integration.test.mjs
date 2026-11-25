import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";
import os from "node:os";
import path from "node:path";

// The reminder sender against a real MongoDB and a stand-in push service:
// what arrives is decrypted (RFC 8291 aes128gcm), so this proves the whole
// send, not just the scheduling. Needs a throwaway database:
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27018/ip-push-test npm test
// (web push is always HTTPS, so the stand-in gets a throwaway self-signed
// certificate from openssl, trusted for this test process only.)
const MONGO = process.env.TEST_MONGODB_URI;
const skip = MONGO ? false : "set TEST_MONGODB_URI to a throwaway database";

function selfSignedCertificate() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "push-test-"));
  const key = path.join(dir, "key.pem");
  const cert = path.join(dir, "cert.pem");
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", key, "-out", cert, "-days", "1", "-subj", "/CN=127.0.0.1"], { stdio: "ignore" });
  const pair = { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
  fs.rmSync(dir, { recursive: true, force: true });
  return pair;
}

function hkdf(salt, ikm, info, length) {
  return Buffer.from(crypto.hkdfSync("sha256", ikm, salt, info, length));
}

/** Decrypts a web push body for a subscription we hold the private key of. */
function decrypt(body, receiver, authSecret) {
  const salt = body.subarray(0, 16);
  const keyLength = body[20];
  const senderPublic = body.subarray(21, 21 + keyLength);
  const ciphertext = body.subarray(21 + keyLength);
  const shared = receiver.computeSecret(senderPublic);
  const receiverPublic = receiver.getPublicKey();
  const ikm = hkdf(authSecret, shared, Buffer.concat([Buffer.from("WebPush: info\0"), receiverPublic, senderPublic]), 32);
  const cek = hkdf(salt, ikm, Buffer.from("Content-Encoding: aes128gcm\0"), 16);
  const nonce = hkdf(salt, ikm, Buffer.from("Content-Encoding: nonce\0"), 12);
  const decipher = crypto.createDecipheriv("aes-128-gcm", cek, nonce);
  decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
  const plain = Buffer.concat([decipher.update(ciphertext.subarray(0, ciphertext.length - 16)), decipher.final()]);
  return plain.subarray(0, plain.lastIndexOf(2)).toString("utf8");
}

test("due reminders are sent once, encrypted, and dead subscriptions retire", { skip }, async () => {
  process.env.MONGODB_URI = MONGO;
  const webpush = await import("web-push");
  const keys = webpush.generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = keys.publicKey;
  process.env.VAPID_PRIVATE_KEY = keys.privateKey;
  webpush.setVapidDetails("mailto:test@innerpause.local", keys.publicKey, keys.privateKey);

  const { getDb } = await import("../src/mongo.ts");
  const { saveSubscription, listActiveSubscriptions } = await import("../src/push-store.ts");
  const { sendDueReminders } = await import("../src/push-scheduler.ts");
  const db = await getDb();
  await db.collection("push_subscriptions").deleteMany({});

  // A stand-in push service: answers each endpoint with the status we set.
  const received = [];
  const statusFor = { "/ok": 201, "/gone": 410, "/flaky": 500 };
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const server = https.createServer(selfSignedCertificate(), (req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      received.push({ path: req.url, headers: req.headers, body: Buffer.concat(chunks) });
      res.writeHead(statusFor[req.url] ?? 201).end();
    });
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const origin = `https://127.0.0.1:${server.address().port}`;

  const receiver = crypto.createECDH("prime256v1");
  receiver.generateKeys();
  const authSecret = crypto.randomBytes(16);
  const subscriptionKeys = { p256dh: receiver.getPublicKey().toString("base64url"), auth: authSecret.toString("base64url") };
  // 20:00 in Kolkata is 14:30 UTC.
  for (const path of ["/ok", "/gone", "/flaky"]) {
    await saveSubscription({ userId: "u1", endpoint: origin + path, keys: subscriptionKeys, pathId: "confidence", reminderTime: "20:00", timezone: "Asia/Kolkata" });
  }

  try {
    const first = await sendDueReminders(new Date("2026-11-25T14:31:00Z"));
    assert.deepEqual(first, { sent: 1, failed: 2 });

    const ok = received.find((item) => item.path === "/ok");
    assert.equal(ok.headers["content-encoding"], "aes128gcm");
    assert.match(ok.headers.authorization, /^vapid t=.+, k=.+/);
    assert.deepEqual(JSON.parse(decrypt(ok.body, receiver, authSecret)), {
      title: "Your Practice is ready",
      body: "A few minutes for your Confidence path. Small steps count.",
      tag: "practice-confidence-2026-11-25",
      url: "/practice/confidence",
    });

    const active = await listActiveSubscriptions();
    assert.deepEqual(active.map((item) => item.endpoint.replace(origin, "")).sort(), ["/flaky", "/ok"], "410 retires the subscription");
    assert.equal(active.find((item) => item.endpoint.endsWith("/flaky")).lastSentLocalDate, undefined, "a passing failure gives the claim back");

    received.length = 0;
    statusFor["/flaky"] = 201;
    const second = await sendDueReminders(new Date("2026-11-25T14:40:00Z"));
    assert.deepEqual(second, { sent: 1, failed: 0 }, "the retry goes out, the sent one doesn't repeat");
    assert.deepEqual(received.map((item) => item.path), ["/flaky"]);

    const nextDay = await sendDueReminders(new Date("2026-11-26T14:35:00Z"));
    assert.deepEqual(nextDay, { sent: 2, failed: 0 }, "a new local day sends again");
  } finally {
    server.close();
    await db.collection("push_subscriptions").deleteMany({});
    await (await import("../src/mongo.ts")).closeMongo();
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  }
});

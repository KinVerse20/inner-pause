import test from "node:test";
import assert from "node:assert/strict";

import { CATCH_UP_MINUTES, dueLocalDate, localClock, reminderMessage } from "../src/reminders.ts";
import { parseSubscriptionBody } from "../src/routes/practice.ts";
import { createApp } from "../src/app.ts";

// 2026-11-25 14:30 UTC is 20:00 in Kolkata (UTC+5:30) and 09:30 in New York.
const at = (iso) => new Date(iso);

test("local clock follows the listener's time zone", () => {
  assert.deepEqual(localClock(at("2026-11-25T14:30:00Z"), "Asia/Kolkata"), { date: "2026-11-25", minutes: 20 * 60 });
  assert.deepEqual(localClock(at("2026-11-25T14:30:00Z"), "America/New_York"), { date: "2026-11-25", minutes: 9 * 60 + 30 });
  // Already tomorrow in Tokyo.
  assert.equal(localClock(at("2026-11-25T16:00:00Z"), "Asia/Tokyo").date, "2026-11-26");
});

test("a reminder is due at its local time, once a day, within the catch-up window", () => {
  const schedule = { reminderTime: "20:00", timezone: "Asia/Kolkata" };
  assert.equal(dueLocalDate(schedule, at("2026-11-25T14:29:00Z")), null, "a minute early");
  assert.equal(dueLocalDate(schedule, at("2026-11-25T14:30:00Z")), "2026-11-25", "on time");
  assert.equal(dueLocalDate(schedule, at("2026-11-25T15:30:00Z")), "2026-11-25", "an hour late, still catching up");
  const pastWindow = new Date(at("2026-11-25T14:30:00Z").getTime() + CATCH_UP_MINUTES * 60_000);
  assert.equal(dueLocalDate(schedule, pastWindow), null, "too late today");
  assert.equal(dueLocalDate({ ...schedule, lastSentLocalDate: "2026-11-25" }, at("2026-11-25T14:45:00Z")), null, "already sent today");
  assert.equal(dueLocalDate({ ...schedule, lastSentLocalDate: "2026-11-24" }, at("2026-11-25T14:45:00Z")), "2026-11-25", "sent yesterday");
});

test("a bad time or time zone never sends", () => {
  assert.equal(dueLocalDate({ reminderTime: "25:00", timezone: "Asia/Kolkata" }, at("2026-11-25T14:30:00Z")), null);
  assert.equal(dueLocalDate({ reminderTime: "20:00", timezone: "Mars/Olympus" }, at("2026-11-25T14:30:00Z")), null);
});

test("the reminder names the path and opens it", () => {
  const message = reminderMessage("anxiety", "2026-11-25");
  assert.equal(message.body, "A few minutes for your Uncertainty path. Small steps count.");
  assert.equal(message.url, "/practice/anxiety");
  assert.equal(message.tag, "practice-anxiety-2026-11-25");
  assert.ok(!/[—–]/.test(message.title + message.body), "our voice: no dashes");
});

const valid = {
  subscription: { endpoint: "https://fcm.googleapis.com/fcm/send/abc123", keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" } },
  pathId: "confidence",
  reminderTime: "20:00",
  timezone: "Asia/Kolkata",
};

test("subscription requests are checked before they're stored", () => {
  assert.ok("value" in parseSubscriptionBody(valid));
  const broken = [
    { ...valid, subscription: { ...valid.subscription, endpoint: "http://insecure.example/push" } },
    { ...valid, subscription: { ...valid.subscription, endpoint: "not a url" } },
    { ...valid, subscription: { ...valid.subscription, keys: { p256dh: "has spaces!", auth: "x" } } },
    { ...valid, pathId: "chakra-root" },
    { ...valid, reminderTime: "8pm" },
    { ...valid, timezone: "Nowhere/Land" },
    {},
  ];
  for (const body of broken) assert.ok("error" in parseSubscriptionBody(body), JSON.stringify(body).slice(0, 80));
});

test("subscribing needs a session; the public key is null until set up", async () => {
  const app = createApp();
  const subscribe = await app.request("/api/practice/push-subscriptions", { method: "POST", body: JSON.stringify(valid), headers: { "content-type": "application/json" } });
  assert.equal(subscribe.status, 401);
  const config = await app.request("/api/practice/push-config");
  assert.deepEqual(await config.json(), { publicKey: null });
});

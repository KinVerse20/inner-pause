import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../src/app.ts";

// In-process (app.request): no port, no database. Only paths that answer
// before touching MongoDB are asserted here.
const app = createApp();

test("the retired admin content and sound endpoints are gone", async () => {
  for (const [method, path] of [
    ["POST", "/api/content/cards"],
    ["PUT", "/api/content/cards/calm"],
    ["DELETE", "/api/content/cards/calm"],
    ["PUT", "/api/content/cards-order"],
    ["POST", "/api/content/skills"],
    ["PUT", "/api/content/skills-order"],
    ["GET", "/api/sounds"],
    ["POST", "/api/sounds"],
    ["PATCH", "/api/sounds/abc"],
    ["DELETE", "/api/sounds/abc"],
  ]) {
    const response = await app.request(path, { method });
    assert.equal(response.status, 404, `${method} ${path}`);
  }
});

test("account endpoints that need a session refuse without one", async () => {
  const response = await app.request("/api/auth/delete-account", { method: "POST" });
  assert.equal(response.status, 401);
});

test("dev test sign-in does not exist unless switched on", async () => {
  const response = await app.request("http://localhost/api/auth/test-sign-in", { method: "POST" });
  assert.equal(response.status, 404);
});

test("the Pass is a year at the offer price; earlier Passes read as they were", async () => {
  const { passStateOf, extendedExpiry } = await import("../src/pass-store.ts");
  const trial = { used: 0, limit: 2, pauseIds: [] };
  assert.deepEqual(passStateOf({ passLifetime: true }), { status: "active", lifetime: true, expiresAt: null, trial });
  assert.deepEqual(passStateOf({}), { status: "none", lifetime: false, expiresAt: null, trial });
  const ended = passStateOf({ passExpiresAt: new Date(Date.now() - 1000) });
  assert.equal(ended.status, "expired", "an earlier 60 day Pass still reads as it was");
  assert.equal(passStateOf({ trialPauseIds: ["a", "b"] }).trial.used, 2);

  const now = new Date("2026-11-27T10:00:00Z");
  const day = 24 * 60 * 60 * 1000;
  assert.equal(extendedExpiry(undefined, 365, now).getTime(), now.getTime() + 365 * day);
  const later = new Date(now.getTime() + 20 * day);
  assert.equal(extendedExpiry(later, 30, now).getTime(), later.getTime() + 30 * day, "added to a Pass still on");
  const past = new Date(now.getTime() - 20 * day);
  assert.equal(extendedExpiry(past, 30, now).getTime(), now.getTime() + 30 * day, "from today once it ended");

  const offer = await (await app.request("/api/pass")).json().catch(() => null);
  if (offer) {
    assert.equal(offer.priceInr, 1000);
    assert.equal(offer.listPriceInr, 2000);
    assert.equal(offer.durationDays, 365);
    assert.equal(offer.trialPauses, 2);
  }
});

test("the ends soon emails are due 7 days and 1 day before", async () => {
  const { reminderDue } = await import("../src/pass-reminders.ts");
  const now = new Date("2026-11-27T10:00:00Z");
  const inDays = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  assert.equal(reminderDue(inDays(10), now), null);
  assert.equal(reminderDue(inDays(7), now), 7);
  assert.equal(reminderDue(inDays(2), now), 7);
  assert.equal(reminderDue(inDays(0.5), now), 1);
  assert.equal(reminderDue(inDays(-1), now), null);
});

test("counting a trial Pause needs a session", async () => {
  assert.equal((await app.request("/api/pass/trial", { method: "POST" })).status, 401);
});

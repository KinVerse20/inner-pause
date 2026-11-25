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

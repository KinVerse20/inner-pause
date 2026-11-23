import test from "node:test";
import assert from "node:assert/strict";

import { localTestAuthEnabled } from "../src/auth/local-test.ts";

test("test sign-in route exists only with the flag, outside production, on loopback", () => {
  const on = { LOCAL_TEST_AUTH: "true", NODE_ENV: "development" };
  assert.equal(localTestAuthEnabled(on, "http://localhost:4000/api/auth/test-sign-in"), true);
  assert.equal(localTestAuthEnabled(on, "http://127.0.0.1:4000/api/auth/test-sign-in"), true);
  assert.equal(localTestAuthEnabled({ LOCAL_TEST_AUTH: "true" }, "http://[::1]:4000/x"), true);

  assert.equal(localTestAuthEnabled({}, "http://localhost:4000/x"), false);
  assert.equal(localTestAuthEnabled({ LOCAL_TEST_AUTH: "false" }, "http://localhost:4000/x"), false);
  assert.equal(localTestAuthEnabled({ LOCAL_TEST_AUTH: "true", NODE_ENV: "production" }, "http://localhost:4000/x"), false);
  assert.equal(localTestAuthEnabled(on, "https://api.theinnerpause.com/x"), false);
  assert.equal(localTestAuthEnabled(on, "http://localhost.attacker.example/x"), false);
  assert.equal(localTestAuthEnabled(on, "not a url"), false);
});

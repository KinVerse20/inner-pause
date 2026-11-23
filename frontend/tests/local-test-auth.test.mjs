import test from "node:test";
import assert from "node:assert/strict";

import { localTestAllowed } from "../lib/local-test.ts";

// Ported from Kinverse's local test sign-in tests, for our same-origin API.
test("test sign-in needs the flag, this machine, and an API on this machine", () => {
  assert.equal(localTestAllowed("true", "localhost", ""), true);
  assert.equal(localTestAllowed("true", "127.0.0.1", "http://127.0.0.1:4000"), true);
  assert.equal(localTestAllowed("true", "[::1]", "http://localhost:4000"), true);
  for (const [flag, host, api] of [
    [undefined, "localhost", ""],
    ["false", "localhost", ""],
    ["1", "localhost", ""],
    ["true", "theinnerpause.com", ""],
    ["true", "localhost.attacker.example", ""],
    ["true", "localhost", "https://api.theinnerpause.com"],
    ["true", "localhost", "https://localhost.attacker.example"],
    ["true", "localhost", "not a URL"],
    ["true", "localhost", "file://localhost/test"],
  ]) assert.equal(localTestAllowed(flag, host, api), false, `${flag} ${host} ${api}`);
});

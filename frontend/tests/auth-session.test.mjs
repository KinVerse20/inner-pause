import assert from "node:assert/strict";
import test from "node:test";

const values = new Map([
  ["innerpause-aws-access-token", "access-token"],
  ["innerpause-aws-id-token", "id-token"],
]);

Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    localStorage: {
      getItem(key) {
        return values.get(key) ?? null;
      },
    },
  },
});

const { getApiToken } = await import("../lib/auth/session.ts");

test("API authentication uses the Cognito ID token expected by API Gateway", () => {
  assert.equal(getApiToken(), "id-token");
});

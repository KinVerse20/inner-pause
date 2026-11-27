import test from "node:test";
import assert from "node:assert/strict";

import { breathCountAt } from "../lib/breath-count.ts";

test("4 seconds in, counting down 4 to 1", () => {
  assert.deepEqual(breathCountAt(0), { phase: "in", count: 4, breath: 1 });
  assert.deepEqual(breathCountAt(0.9), { phase: "in", count: 4, breath: 1 });
  assert.deepEqual(breathCountAt(1), { phase: "in", count: 3, breath: 1 });
  assert.deepEqual(breathCountAt(3.5), { phase: "in", count: 1, breath: 1 });
});

test("then 6 seconds out, counting down 6 to 1", () => {
  assert.deepEqual(breathCountAt(4), { phase: "out", count: 6, breath: 1 });
  assert.deepEqual(breathCountAt(9.9), { phase: "out", count: 1, breath: 1 });
});

test("round after round", () => {
  assert.deepEqual(breathCountAt(10), { phase: "in", count: 4, breath: 2 });
  assert.deepEqual(breathCountAt(25), { phase: "out", count: 5, breath: 3 });
});

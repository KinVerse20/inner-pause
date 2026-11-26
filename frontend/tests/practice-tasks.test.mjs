import test from "node:test";
import assert from "node:assert/strict";

import { daysAway, taskFor, tasksThatWorked } from "../lib/practice-tasks.ts";

const actions = ["Task one.", "Task two.", "Task three.", "Task four."];

test("each day gives its own task", () => {
  assert.deepEqual(taskFor(actions, [], 1), { task: "Task one.", carried: false });
  assert.deepEqual(taskFor(actions, [{ day: 2, taskAnswer: "yes" }], 2), { task: "Task two.", carried: false });
  assert.deepEqual(taskFor(actions, [{ day: 2, taskAnswer: "partly" }], 2), { task: "Task two.", carried: false });
});

test("Not yet keeps the same task one more day, then the path moves on", () => {
  const checkIns = [{ day: 2, taskAnswer: "not-yet" }, { day: 3, taskAnswer: "not-yet" }];
  assert.deepEqual(taskFor(actions, checkIns, 2), { task: "Task one.", carried: true });
  // Not yet again: only one extra day, so day 3 gives its own.
  assert.deepEqual(taskFor(actions, checkIns, 3), { task: "Task three.", carried: false });
});

test("what worked: the tasks you said you did, or partly did", () => {
  assert.deepEqual(tasksThatWorked(actions, [{ day: 2, taskAnswer: "yes" }, { day: 3, taskAnswer: "partly" }, { day: 4, taskAnswer: "yes" }]), ["Task one.", "Task three."]);
  assert.deepEqual(tasksThatWorked(actions, [{ day: 3, taskAnswer: "partly" }]), ["Task two."]);
  assert.deepEqual(tasksThatWorked(actions, [{ day: 2, taskAnswer: "not-yet" }]), []);
});

test("days away from the path", () => {
  const monday = new Date(2026, 10, 23, 21, 0).toISOString();
  assert.equal(daysAway(monday, new Date(2026, 10, 23, 22, 0)), 0);
  assert.equal(daysAway(monday, new Date(2026, 10, 24, 8, 0)), 0);
  assert.equal(daysAway(monday, new Date(2026, 10, 25, 8, 0)), 1);
  assert.equal(daysAway(monday, new Date(2026, 10, 27, 8, 0)), 3);
});

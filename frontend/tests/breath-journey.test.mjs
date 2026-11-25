import test from "node:test";
import assert from "node:assert/strict";

import { STAGES, buildJourney, journeyAt } from "../lib/breath-journey.ts";

for (const minutes of [3, 5, 10]) {
  test(`a ${minutes} minute Pause is one unbroken journey through every stage, in order`, () => {
    const total = minutes * 60;
    const journey = buildJourney(total, ["The Pause's own line."]);
    assert.equal(journey[0].start, 0);
    for (let i = 1; i < journey.length; i++) assert.equal(journey[i].start, journey[i - 1].end, `no gap or overlap at ${i}`);
    assert.ok(Math.abs(journey.at(-1).end - total) <= 1, `ends with the Pause (${journey.at(-1).end} vs ${total})`);
    const order = [...new Set(journey.map((segment) => segment.stage))];
    assert.deepEqual(order, STAGES.map((stage) => stage.id));
  });
}

test("breaths are counted, and the out breath lengthens round by round", () => {
  const journey = buildJourney(600);
  const outs = journey.filter((segment) => segment.step.kind === "out").map((segment) => segment.step.seconds);
  assert.deepEqual([...new Set(outs)], [4, 6, 7]);
  const firstIn = journey.find((segment) => segment.step.kind === "in").step;
  assert.equal(firstIn.breath, 1);
  assert.ok(firstIn.of >= 2);
});

test("the Pause's own words are spoken while resting", () => {
  const journey = buildJourney(600, ["Nothing needs to be solved right now."]);
  const rest = journey.filter((segment) => segment.stage === "rest" && segment.step.kind === "cue").map((segment) => segment.step.text);
  assert.equal(rest[0], "Nothing needs to be solved right now.");
});

test("a moment in the Pause maps to its step", () => {
  const journey = buildJourney(600);
  assert.equal(journeyAt(journey, 0).stage, "arrive");
  assert.equal(journeyAt(journey, 599).stage, "return");
  assert.equal(journeyAt(journey, 10_000).stage, "return", "past the end stays on the last step");
});

test("our voice: no dashes in what it says", () => {
  const text = buildJourney(600).flatMap((segment) => (segment.step.kind === "cue" ? [segment.step.text] : [])).join(" ");
  assert.ok(!/[—–]/.test(text));
});

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

test("gentle reminders, the Pause's own and the familiar ones, come all through it", () => {
  const journey = buildJourney(600, ["The Pause's own line."]);
  const reminders = journey.filter((segment) => segment.step.kind === "reminder");
  const texts = reminders.map((segment) => segment.step.text);
  assert.equal(texts[0], "The Pause's own line.", "the Pause's own words come first");
  assert.ok(texts.includes("Nothing needs to be solved right now."), "the familiar reminders are kept");
  for (const stage of ["arrive", "soften", "breathe", "rest"]) {
    assert.ok(reminders.some((segment) => segment.stage === stage), `a reminder during ${stage}`);
  }
  const firstMinutes = reminders.filter((segment) => segment.start < 300).length;
  assert.ok(firstMinutes >= 4, `about one a minute early on (got ${firstMinutes} in 5 minutes)`);
});

test("a moment in the Pause maps to its step", () => {
  const journey = buildJourney(600);
  assert.equal(journeyAt(journey, 0).stage, "arrive");
  assert.equal(journeyAt(journey, 599).stage, "return");
  assert.equal(journeyAt(journey, 10_000).stage, "return", "past the end stays on the last step");
});

test("our voice: no dashes in what it says", () => {
  const text = buildJourney(600).flatMap((segment) => ("text" in segment.step ? [segment.step.text] : [])).join(" ");
  assert.ok(!/[—–]/.test(text));
});

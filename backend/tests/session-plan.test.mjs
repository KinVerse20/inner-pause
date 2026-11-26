import test from "node:test";
import assert from "node:assert/strict";

import { FEELING_CENTRES, MAX_TELL_EMOTIONS, planFeelingStops, stopAt, tellEmotions } from "@inner-pause/shared";

// Ported from Sahil's session-planning tests (feature/practice-guided-
// breathing-mindspace), adjusted to the founder's rules: the Pause keeps
// its length and the stops share it.
const TEN_MINUTES = 600;

test("five feelings on four centres give four stops, root to crown, sharing ten minutes", () => {
  const stops = planFeelingStops(["Sadness", "Fear", "Anxiety", "Confusion", "Guilt"], TEN_MINUTES);
  assert.deepEqual(stops.map((stop) => stop.hz), [396, 417, 639, 852]);
  assert.deepEqual(stops[0].feelings, ["Fear", "Anxiety"]);
  assert.deepEqual(stops.map((stop) => stop.seconds), [150, 150, 150, 150]);
});

test("Anxiety and Loneliness: Root then Heart, five minutes each", () => {
  const stops = planFeelingStops(["Loneliness", "Anxiety"], TEN_MINUTES);
  assert.deepEqual(stops.map((stop) => [stop.chakraId, stop.hz, stop.seconds]), [["root", 396, 300], ["heart", 639, 300]]);
});

test("the length is split, never added to", () => {
  for (const [feelings, seconds] of [
    [["Anxiety"], [600]],
    [["Anxiety", "Grief"], [300, 300]],
    [["Anxiety", "Grief", "Anger"], [200, 200, 200]],
    [["Anxiety", "Guilt", "Grief", "Anger"], [150, 150, 150, 150]],
  ]) {
    const stops = planFeelingStops(feelings, TEN_MINUTES);
    assert.deepEqual(stops.map((stop) => stop.seconds), seconds);
    assert.equal(stops.reduce((sum, stop) => sum + stop.seconds, 0), TEN_MINUTES);
  }
  // An uneven split keeps the total.
  assert.equal(planFeelingStops(["Anxiety", "Grief", "Anger"], 500).reduce((sum, stop) => sum + stop.seconds, 0), 500);
});

test("feelings on one centre make one stop", () => {
  const stops = planFeelingStops(["Grief", "Hurt", "Loneliness"], TEN_MINUTES);
  assert.equal(stops.length, 1);
  assert.deepEqual(stops[0].feelings, ["Grief", "Hurt", "Loneliness"]);
});

test("every Tell feeling has a centre, and nothing picked is ever dropped", () => {
  for (const feeling of tellEmotions) assert.ok(FEELING_CENTRES[feeling], feeling);
  // As many feelings as Tell allows, each on its own centre: one stop each.
  assert.equal(planFeelingStops(["Fear", "Guilt", "Shame", "Anger"].slice(0, MAX_TELL_EMOTIONS), TEN_MINUTES).length, 4);
  assert.deepEqual(planFeelingStops(["Not a feeling"], TEN_MINUTES), []);
});

test("which stop is playing", () => {
  const stops = planFeelingStops(["Anxiety", "Grief"], TEN_MINUTES);
  assert.equal(stopAt(stops, 0).index, 0);
  assert.equal(stopAt(stops, 299).index, 0);
  assert.equal(stopAt(stops, 300).index, 1);
  assert.equal(stopAt(stops, 300).startsAt, 300);
  assert.equal(stopAt(stops, 600).index, 1);
});

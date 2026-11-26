import test from "node:test";
import assert from "node:assert/strict";

import { addListening, countsAsDay, listenedSeconds, minutesLabel, nextDayOpensTomorrow, resumeAt } from "../lib/listening.ts";

const monday = new Date(2026, 10, 23, 9, 0);
const mondayEvening = new Date(2026, 10, 23, 21, 0);
const tuesday = new Date(2026, 10, 24, 9, 0);
const fiveMinutes = { durationSeconds: 300 };

test("a day counts once half its session is listened to", () => {
  assert.equal(countsAsDay(addListening(fiveMinutes, 149, 149, monday)), false);
  assert.equal(countsAsDay(addListening(fiveMinutes, 150, 150, monday)), true);
  assert.equal(countsAsDay(addListening({ durationSeconds: 600 }, 299, 299, monday)), false);
  assert.equal(countsAsDay(addListening({ durationSeconds: 600 }, 300, 300, monday)), true);
});

test("sittings on the same day add up, sittings on different days don't", () => {
  const morning = addListening(fiveMinutes, 90, 90, monday);
  assert.equal(countsAsDay(addListening(morning, 60, 150, mondayEvening)), true);
  assert.equal(countsAsDay(addListening(morning, 60, 150, tuesday)), false);
});

test("checking in after a few seconds no longer completes a day", () => {
  const quick = { ...addListening(fiveMinutes, 5, 5, monday), completedAt: monday.toISOString() };
  assert.equal(countsAsDay(quick), false);
});

test("older records, never timed, still count by their check-in", () => {
  assert.equal(countsAsDay({ ...fiveMinutes, completedAt: monday.toISOString() }), true);
  assert.equal(countsAsDay(fiveMinutes), false);
  assert.equal(listenedSeconds(fiveMinutes), 300);
});

test("time listened adds up, and the clock position is kept", () => {
  const record = addListening(addListening(fiveMinutes, 40, 40, monday), 80, 120, monday);
  assert.equal(listenedSeconds(record), 120);
  assert.equal(record.positionSeconds, 120);
});

test("picking up where you left off", () => {
  // Stopped at 2 minutes today: carry on from there.
  assert.equal(resumeAt(addListening(fiveMinutes, 120, 120, monday), mondayEvening), 120);
  // Stopped at 4:30 yesterday: 30 seconds left can't make up today's half, so from the start.
  assert.equal(resumeAt(addListening(fiveMinutes, 100, 270, monday), tuesday), 0);
  // Never played, or played to the end.
  assert.equal(resumeAt(fiveMinutes, monday), 0);
  assert.equal(resumeAt(addListening(fiveMinutes, 300, 300, monday), monday), 0);
});

test("the next Practice day opens tomorrow", () => {
  const doneToday = [{ completedAt: monday.toISOString() }];
  assert.equal(nextDayOpensTomorrow(doneToday, 14, mondayEvening), true);
  assert.equal(nextDayOpensTomorrow(doneToday, 14, tuesday), false);
  assert.equal(nextDayOpensTomorrow([], 14, monday), false);
  // The last day: nothing opens next.
  assert.equal(nextDayOpensTomorrow(Array.from({ length: 14 }, () => ({ completedAt: monday.toISOString() })), 14, monday), false);
});

test("minutes, in our voice", () => {
  assert.equal(minutesLabel(20), "Under 1 min");
  assert.equal(minutesLabel(150), "3 min");
  assert.equal(minutesLabel(600), "10 min");
});

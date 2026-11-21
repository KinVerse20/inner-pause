import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PlaybackClock } from '../lib/revised-playback-clock.ts';
import { createSessionPlan } from '../../packages/shared/src/session-planning.ts';

test('elapsed time survives pauses and sequential skips, and exit prevents resume', () => {
  let seconds = 0;
  const plan = createSessionPlan({ inputMode: 'direct', emotionIds: ['fear', 'sadness'], depth: 'quick', sound: 'rain', tonePreset: 'soft' });
  const clock = new PlaybackClock(plan, () => seconds);
  clock.play(); seconds = 121; assert.equal(clock.elapsed, 121);
  clock.pause(); seconds = 200; assert.equal(clock.elapsed, 121);
  clock.play(); seconds = 210; assert.equal(clock.elapsed, 131);
  clock.skip(); assert.equal(clock.elapsed, 300); assert.equal(clock.blockIndex, 1);
  seconds = 511; assert.equal(clock.elapsed, 600); assert.equal(clock.completed, true);
  const exited = new PlaybackClock(plan, () => seconds);
  exited.play(); seconds += 10; exited.exit(); exited.play(); seconds += 20;
  assert.equal(exited.elapsed, 10); assert.equal(exited.playing, false);
});

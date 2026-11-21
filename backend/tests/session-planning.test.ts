import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionPlan, type SessionInput } from '../../packages/shared/src/session-planning.js';
const input: SessionInput = { emotionIds: ['sadness', 'fear', 'anxiety', 'confusion', 'guilt'], inputMode: 'direct', depth: 'deep', sound: 'rain', tonePreset: 'soft' };
test('five emotions sharing four chakras yield four sequential frequencies and one hour', () => {
  const plan = createSessionPlan(input);
  assert.deepEqual(plan.blocks.map(b => b.frequencyHz), [396, 417, 639, 852]);
  assert.equal(plan.totalSeconds, 3600);
  assert.deepEqual(plan.blocks[0].emotionIds, ['fear', 'anxiety']);
});
test('quick and complete cover every selected chakra with the chosen duration', () => {
  assert.equal(createSessionPlan({ ...input, depth: 'quick' }).totalSeconds, 1200);
  assert.equal(createSessionPlan({ ...input, depth: 'complete' }).totalSeconds, 2400);
  assert.equal(createSessionPlan({ ...input, depth: 'deep', minutesPerFrequency: 5 }).totalSeconds, 1200);
});
test('written input needs text and all plan settings are validated', () => {
  assert.throws(() => createSessionPlan({ ...input, inputMode: 'written' }));
  for (const extra of [{ depth: 'bad' }, { sound: 'bad' }, { tonePreset: '__proto__' }, { minutesPerFrequency: 1 }]) assert.throws(() => createSessionPlan({ ...input, ...extra } as SessionInput));
  assert.equal(createSessionPlan({ ...input, inputMode: 'written', reflection: 'I am sad.' }).selection.inputMode, 'written');
});

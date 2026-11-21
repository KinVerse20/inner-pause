import test from 'node:test';
import assert from 'node:assert/strict';
import { emotionCatalog } from '../../packages/shared/src/emotion-catalog.ts';
import { soundExperiences, tonePresets } from '../../packages/shared/src/session-planning.ts';
import { moments, quickPauses, soundOptions, toneLevelDb, uniqueChakras } from '../lib/phase-one-data.ts';

test('Inner Pause exposes the approved sound experiences and undertone levels', () => {
  assert.deepEqual(soundOptions.map(item => item.id), ['rain', 'forest', 'waves', 'wind', 'binaural-focus', 'bilateral-calm', 'mindspace', 'frequency-only']);
  assert.deepEqual([...soundExperiences], ['rain', 'forest', 'waves', 'wind', 'binaural-focus', 'bilateral-calm', 'mindspace', 'frequency-only']);
  assert.deepEqual(toneLevelDb, { soft: -48, balanced: -45, clear: -39 });
  assert.deepEqual(tonePresets, toneLevelDb);
});

test('Moments contains twelve valid situations in each of the three categories', () => {
  const emotionIds = new Set(emotionCatalog.map(item => item.id));
  for (const category of ['coming-up', 'happening-now', 'just-happened']) {
    assert.equal(moments.filter(item => item.category === category).length, 12);
  }
  assert.equal(new Set(moments.map(item => item.id)).size, 36);
  for (const moment of moments) {
    assert.ok(moment.emotionIds.length >= 2);
    assert.ok(moment.emotionIds.every(id => emotionIds.has(id)), `${moment.id} has an invalid emotion`);
    assert.ok(soundExperiences.includes(moment.sound));
    assert.ok(Object.hasOwn(tonePresets, moment.tonePreset));
    assert.ok(uniqueChakras(moment.emotionIds).length >= 1);
  }
});

test('Home includes six ready-made Pauses with valid mappings', () => {
  assert.equal(quickPauses.length, 6);
  assert.deepEqual(quickPauses.map(item => item.id), ['sleep', 'reset', 'focus', 'confidence', 'calm', 'release']);
  for (const pause of quickPauses) {
    assert.ok(pause.emotionIds.length >= 2);
    assert.ok(uniqueChakras(pause.emotionIds).length >= 1);
  }
});

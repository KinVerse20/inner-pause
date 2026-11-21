import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { emotionCatalog } from '../../packages/shared/src/emotion-catalog.ts';
import { soundExperiences } from '../../packages/shared/src/session-planning.ts';
import { practiceIssues } from '../lib/practice-data.ts';

test('Practice has five issues and fourteen complete, distinct days for each', () => {
  assert.equal(practiceIssues.length, 5);
  assert.deepEqual(practiceIssues.map(issue => issue.id), ['confidence', 'anxiety', 'focus', 'reactivity', 'sleep']);
  for (const issue of practiceIssues) {
    assert.equal(issue.days.length, 14, issue.id);
    assert.deepEqual(issue.days.map(day => day.day), Array.from({ length: 14 }, (_, index) => index + 1));
    assert.equal(new Set(issue.days.map(day => day.title)).size, 14, `${issue.id} day titles must be unique`);
    for (const day of issue.days) {
      for (const field of ['title', 'intention', 'checkInPrompt', 'exercise', 'action', 'reflection']) assert.ok(day[field]?.trim(), `${issue.id} day ${day.day} ${field}`);
      assert.ok([5, 10, 15].includes(day.minutes));
      assert.ok(soundExperiences.includes(day.sound));
      assert.ok(day.emotionIds.every(id => emotionCatalog.some(emotion => emotion.id === id)));
    }
  }
});

test('stereo practices are clearly marked as headphone experiences', () => {
  const stereo = new Set(['binaural-focus', 'bilateral-calm']);
  assert.ok(practiceIssues.some(issue => issue.days.some(day => stereo.has(day.sound))));
});

test('PWA service worker supports closed-app push and notification navigation', () => {
  const worker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(worker, /addEventListener\("push"/);
  assert.match(worker, /showNotification/);
  assert.match(worker, /addEventListener\("notificationclick"/);
  assert.match(worker, /openWindow/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RevisedAudioPlayer } from '../lib/revised-audio.ts';
import { createSessionPlan } from '../../packages/shared/src/session-planning.ts';

function context() {
  const sources = [];
  return {
    currentTime: 0, destination: {}, sources,
    async decodeAudioData() { return { duration: 10 }; },
    async resume() {}, async suspend() {}, async close() {},
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, cancelAndHoldAtTime() {}, setTargetAtTime() {} }, connect() {}, disconnect() {} }; },
    createBufferSource() {
      const source = { loop: false, start() {}, stop() { this.onended?.(); }, connect(node) { return node; }, disconnect() {} };
      sources.push(source); return source;
    },
  };
}
test('switching ambience and tone strength preserves elapsed time and frequency position', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }));
  const plan = createSessionPlan({ inputMode: 'direct', emotionIds: ['anxiety', 'sadness'], depth: 'quick', sound: 'rain', tonePreset: 'soft' });
  const audio = context();
  const player = new RevisedAudioPlayer(plan, audio, { rain: { url: '/rain.wav' }, forest: { url: '/forest.wav' } });
  try {
    await player.play(); audio.currentTime = 75;
    await player.switchSound('forest');
    player.setPreset('clear');
    assert.equal(player.clock.elapsed, 75);
    assert.equal(player.clock.blockIndex, 0);
    await player.switchSound('frequency-only');
    assert.equal(player.clock.elapsed, 75);
    player.skip(); assert.equal(player.clock.blockIndex, 1);
    await player.pause(); audio.currentTime = 80;
    assert.equal(player.clock.elapsed, 300);
    assert.ok(audio.sources.every(source => source.loop));
  } finally { await player.exit(); await player.exit(); }
});
test('missing approved recordings fail explicitly without advancing the session', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }));
  const plan = createSessionPlan({ inputMode: 'direct', emotionIds: ['anxiety'], depth: 'quick', sound: 'rain', tonePreset: 'soft' });
  const player = new RevisedAudioPlayer(plan, context(), {});
  try {
    await assert.rejects(player.play(), /has not been imported/);
    assert.equal(player.clock.elapsed, 0);
    assert.equal(player.clock.playing, false);
  } finally { await player.exit(); }
});

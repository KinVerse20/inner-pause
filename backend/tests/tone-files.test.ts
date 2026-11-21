import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tonePresets } from '../../packages/shared/src/session-planning.js';
test('stored tones contain the target frequency throughout and presets have headroom', async () => {
  for (const hz of [396, 417, 528, 639, 741, 852, 963]) {
    const wav = await readFile(new URL(`../../frontend/public/audio/revised/tones/${hz}.wav`, import.meta.url));
    assert.equal(wav.readUInt32LE(24), 48000);
    assert.equal(wav.readUInt32LE(40) / 2 / 48000, 10);
    for (const second of [0, 4, 9]) {
      let re = 0, im = 0, energy = 0;
      for (let n = 0; n < 48000; n++) {
        const sample = wav.readInt16LE(44 + (second * 48000 + n) * 2) / 32767;
        re += sample * Math.cos(2 * Math.PI * hz * n / 48000);
        im += sample * Math.sin(2 * Math.PI * hz * n / 48000);
        energy += sample * sample;
      }
      const amplitude = 2 * Math.hypot(re, im) / 48000;
      assert.ok(Math.abs(amplitude - 0.8) < 0.0001);
      assert.ok(Math.abs(energy / 48000 - 0.32) < 0.0001);
      for (const db of Object.values(tonePresets)) assert.ok(amplitude * (10 ** (db / 20) / 0.8) < 0.13);
    }
  }
});

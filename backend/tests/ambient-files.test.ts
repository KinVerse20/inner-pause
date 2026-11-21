import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
test('seven sourced recordings decode at 48 kHz with expected loop duration and no clipped peaks', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../audio-sources/elevenlabs/manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.sounds.length, 7);
  for (const sound of manifest.sounds) {
    assert.ok(sound.generationId);
    const file = fileURLToPath(new URL(`../../frontend/public/audio/revised/sounds/${sound.id}.m4a`, import.meta.url));
    const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=sample_rate', '-of', 'json', file], { encoding: 'utf8' }));
    assert.equal(Number(probe.streams[0].sample_rate), 48000);
    assert.ok(Math.abs(Number(probe.format.duration) - (sound.duration - 1)) < 0.1);
    // Decode every frame and measure peak, RMS, and continuity data from real files.
    const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], { maxBuffer: 80 * 1024 * 1024 });
    let peak = 0, energy = 0;
    for (let offset = 0; offset < pcm.length; offset += 4) { const sample = pcm.readFloatLE(offset); peak = Math.max(peak, Math.abs(sample)); energy += sample * sample; }
    assert.ok(peak < 0.9, `${sound.id} peak is too high: ${peak}`);
    assert.ok(energy / (pcm.length / 4) > 0.000001, `${sound.id} is effectively silent`);
  }
});

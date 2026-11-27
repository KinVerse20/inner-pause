import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import { BUILT_IN_SOUNDS, RECORDED_FREQUENCIES, findBuiltInSound, playableSound, soundUrlFor } from "../lib/sound-library.ts";

// What the player says is what plays: a tuned recording only at its own
// frequency, never a near one.

test("a tuned recording plays only at exactly its frequency", () => {
  const ambient = findBuiltInSound("deep-ambient");
  assert.equal(soundUrlFor(ambient, 396), "/audio/chakras/396/ambient_396Hz.mp3");
  assert.equal(soundUrlFor(ambient, 432), null, "no 432 recording: not the 417 one");
  assert.equal(soundUrlFor(ambient, null), null);
});

test("a tuned choice with no recording at this frequency plays Rain", () => {
  assert.equal(playableSound("deep-ambient", 432, false).id, "rain");
  assert.equal(playableSound("deep-ambient", 528, true).id, "rain", "several centres");
  assert.equal(playableSound("deep-ambient", 528, false).id, "deep-ambient");
  // Made in the app, so any frequency and several centres work.
  assert.equal(playableSound("binaural-focus", 432, true).id, "binaural-focus");
  assert.equal(playableSound("frequency-only", 7.83, false).id, "frequency-only");
});

test("retired sounds play their replacement", () => {
  assert.equal(findBuiltInSound("forest")?.id, "rainforest");
  assert.equal(findBuiltInSound("tuned-forest")?.id, "rainforest");
  assert.equal(findBuiltInSound("tuned-rain")?.id, "rain");
  assert.equal(findBuiltInSound("piano")?.id, "tuned-piano");
  assert.equal(findBuiltInSound("gong")?.id, "rain");
  assert.equal(findBuiltInSound("bell")?.id, "rain");
  assert.equal(findBuiltInSound("nonsense"), undefined);
});

test("every sound's file exists, at every recorded frequency", () => {
  for (const sound of BUILT_IN_SOUNDS) {
    if (sound.url) assert.ok(existsSync(new URL(`../public${sound.url}`, import.meta.url)), sound.url);
    if (sound.tunedFile) {
      for (const hz of RECORDED_FREQUENCIES) {
        const url = soundUrlFor(sound, hz);
        assert.ok(existsSync(new URL(`../public${url}`, import.meta.url)), url);
      }
    }
  }
});

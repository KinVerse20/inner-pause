import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const {
  chakraFrequencies,
  chakraSoundStyles,
  getChakraAudioPath,
  getChakraFrequencyLabel,
} = await import("../lib/chakra-audio.ts");

const expectedFrequencies = {
  root: 396,
  sacral: 417,
  "solar-plexus": 528,
  heart: 639,
  throat: 741,
  "third-eye": 852,
  crown: 963,
};

test("maps every chakra to its required frequency", () => {
  assert.deepEqual(chakraFrequencies, expectedFrequencies);

  for (const [chakraId, frequency] of Object.entries(expectedFrequencies)) {
    assert.equal(getChakraFrequencyLabel(chakraId), `${frequency} Hz`);
  }
});

test("maps all four sound styles to every chakra asset", () => {
  const checkedPaths = new Set();

  for (const chakraId of Object.keys(expectedFrequencies)) {
    for (const style of chakraSoundStyles) {
      const audioPath = getChakraAudioPath(chakraId, style.id);
      const assetPath = fileURLToPath(new URL(`../public${audioPath}`, import.meta.url));

      assert.equal(existsSync(assetPath), true, `Missing audio asset: ${audioPath}`);
      checkedPaths.add(audioPath);
    }
  }

  assert.equal(checkedPaths.size, 28);
});

test("uses one selected style consistently across a multi-chakra session", () => {
  const selectedChakras = ["root", "solar-plexus", "heart"];

  assert.deepEqual(
    selectedChakras.map((chakraId) => getChakraAudioPath(chakraId, "piano")),
    [
      "/audio/chakras/396/piano_396Hz.mp3",
      "/audio/chakras/528/piano_528Hz.mp3",
      "/audio/chakras/639/piano_639Hz.mp3",
    ],
  );
});

test("changing the style keeps the chakra frequency unchanged", () => {
  assert.equal(getChakraAudioPath("crown", "rain"), "/audio/chakras/963/rain_963Hz.mp3");
  assert.equal(getChakraAudioPath("crown", "ambient"), "/audio/chakras/963/ambient_963Hz.mp3");
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const player = await readFile(new URL("../components/healing-audio-player-screen.tsx", import.meta.url), "utf8");

test("provides reduced-motion fallbacks for the new ritual visuals", () => {
  const motionStyles = css.slice(css.indexOf("/* Breath & Ripple motion language */"));
  const reducedMotionSection = motionStyles.slice(motionStyles.indexOf("@media (prefers-reduced-motion: reduce)"));

  for (const className of [
    ".breath-ripple__ring",
    ".energy-particle-field__particle",
    ".chakra-result-card",
    ".healing-visualizer *",
    ".completion-bloom *",
  ]) {
    assert.match(reducedMotionSection, new RegExp(className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("changing sound does not reset the healing session timer", () => {
  const applySoundStart = player.indexOf("const applySoundStyle");
  const applySoundEnd = player.indexOf("return (", applySoundStart);
  const applySoundImplementation = player.slice(applySoundStart, applySoundEnd);

  assert.ok(applySoundStart >= 0);
  assert.doesNotMatch(applySoundImplementation, /setElapsedInBlock|setBlockIndex/);
  assert.match(applySoundImplementation, /setSoundStyle/);
  assert.match(applySoundImplementation, /prepareAndPlayAudio/);
});

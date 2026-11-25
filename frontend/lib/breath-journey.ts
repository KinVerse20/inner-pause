// A Pause as a short guided journey, not a metronome. It arrives, softens
// the body part by part, finds the breath, breathes together in counted
// rounds whose out-breath slowly lengthens, rests in stillness (with the
// Pause's own words), then comes gently back. It fits any length: short
// Pauses keep the arc and trim the middle.
//
// Pure, so it's tested without a player (tests/breath-journey.test.mjs).
// components/breathing-guide.tsx shows it; the Harmony Form breathes with it.

export type JourneyStage = "arrive" | "soften" | "notice" | "breathe" | "rest" | "return";

export const STAGES: Array<{ id: JourneyStage; label: string }> = [
  { id: "arrive", label: "Arriving" },
  { id: "soften", label: "Softening" },
  { id: "notice", label: "Noticing" },
  { id: "breathe", label: "Breathing together" },
  { id: "rest", label: "Resting" },
  { id: "return", label: "Coming back" },
];

export type JourneyStep =
  | { kind: "cue"; text: string }
  | { kind: "quiet" }
  | { kind: "in" | "out"; seconds: number; breath: number; of: number };

export interface JourneySegment {
  stage: JourneyStage;
  start: number;
  end: number;
  step: JourneyStep;
}

const ARRIVE = [
  "Welcome. Let yourself arrive.",
  "Find a way of sitting or lying that feels steady.",
  "Let your eyes close, or rest your gaze softly downward.",
  "Notice the sound around you. Nothing else needs you right now.",
];

const SOFTEN = [
  "Soften your forehead, and the space between your eyes.",
  "Let your jaw loosen. Your tongue can rest.",
  "Let your shoulders drop away from your ears.",
  "Feel your arms grow heavy. Let your hands rest open.",
  "Notice your chest, rising and falling on its own.",
  "Let your belly be soft. Nothing to hold in.",
  "Feel the weight of your legs, and whatever is holding you up.",
];
// For a short Pause: the same journey down the body, in fewer steps.
const SOFTEN_SHORT = [SOFTEN[0], SOFTEN[2], SOFTEN[5], SOFTEN[6]];

const NOTICE = [
  "Now notice where you feel your breath most.",
  "Maybe the cool air at your nose, and the warm air leaving.",
  "Or the rise of your chest, the gentle swell of your belly.",
];

const ROUNDS: Array<{ intro: string; inhale: number; exhale: number; breaths: number }> = [
  { intro: "Let's breathe together. In for four, out for four.", inhale: 4, exhale: 4, breaths: 4 },
  { intro: "Lovely. Now let the out breath grow a little longer.", inhale: 4, exhale: 6, breaths: 5 },
  { intro: "Slower still. A long, easy breath out.", inhale: 4, exhale: 7, breaths: 5 },
];

const REST_FALLBACK = [
  "Let the breath find its own pace now.",
  "If your mind wanders, that's all right. Come back to the sound.",
  "There is nothing to fix right now.",
  "Rest here, held by the sound.",
];

const RETURN = [
  "Begin to let your breath grow a little deeper.",
  "Wiggle your fingers and toes.",
  "Notice the room around you, the sounds beyond this one.",
  "When you're ready, gently open your eyes.",
];

const CUE_SECONDS = 8;
const REST_LINE_SECONDS = 12;
const REST_QUIET_SECONDS = 14;

/** Builds the journey for a Pause of this length. `restLines` are the Pause's own words. */
export function buildJourney(totalSeconds: number, restLines: string[] = []): JourneySegment[] {
  const total = Math.max(60, Math.floor(totalSeconds));
  const short = total < 300;
  const segments: JourneySegment[] = [];
  let t = 0;
  const cue = (stage: JourneyStage, text: string, seconds = CUE_SECONDS) => {
    segments.push({ stage, start: t, end: t + seconds, step: { kind: "cue", text } });
    t += seconds;
  };

  const arrive = short ? ARRIVE.slice(0, 2).concat(ARRIVE[3]) : ARRIVE;
  const soften = short ? SOFTEN_SHORT : SOFTEN;
  const notice = short ? NOTICE.slice(0, 2) : NOTICE;
  const returnLines = short ? [RETURN[0], RETURN[2], RETURN[3]] : RETURN;
  const returnSeconds = returnLines.length * CUE_SECONDS;

  for (const line of arrive) cue("arrive", line);
  for (const line of soften) cue("soften", line, 9);
  for (const line of notice) cue("notice", line);

  // Breathing rounds take what's left after a fair share for resting.
  const middle = total - t - returnSeconds;
  const breatheBudget = short ? middle * 0.7 : middle * 0.55;
  const breatheEnd = t + breatheBudget;
  for (const [index, round] of ROUNDS.entries()) {
    const cycle = round.inhale + round.exhale;
    const isLast = index === ROUNDS.length - 1;
    const room = breatheEnd - t - 6;
    if (room < cycle * 2) break;
    // The last round stretches to fill the breathing time; the others keep their count.
    const breaths = isLast ? Math.max(2, Math.floor(room / cycle)) : Math.min(round.breaths, Math.floor(room / cycle));
    cue("breathe", round.intro, 6);
    for (let breath = 1; breath <= breaths; breath++) {
      segments.push({ stage: "breathe", start: t, end: t + round.inhale, step: { kind: "in", seconds: round.inhale, breath, of: breaths } });
      t += round.inhale;
      segments.push({ stage: "breathe", start: t, end: t + round.exhale, step: { kind: "out", seconds: round.exhale, breath, of: breaths } });
      t += round.exhale;
    }
  }

  // Rest: the Pause's own words, each followed by quiet, until it's time to come back.
  const restEnd = total - returnSeconds;
  const lines = [...restLines.filter((line) => line.trim()), ...REST_FALLBACK];
  let lineIndex = 0;
  while (t < restEnd) {
    const text = lines[lineIndex % lines.length];
    lineIndex += 1;
    const lineEnd = Math.min(restEnd, t + REST_LINE_SECONDS);
    segments.push({ stage: "rest", start: t, end: lineEnd, step: { kind: "cue", text } });
    t = lineEnd;
    if (t >= restEnd) break;
    const quietEnd = Math.min(restEnd, t + REST_QUIET_SECONDS);
    segments.push({ stage: "rest", start: t, end: quietEnd, step: { kind: "quiet" } });
    t = quietEnd;
  }

  for (const line of returnLines) cue("return", line);
  return segments;
}

/** Where the journey is at this moment. Past the end, it stays on the last step. */
export function journeyAt(journey: JourneySegment[], elapsedSeconds: number) {
  const at = Math.max(0, elapsedSeconds);
  const segment = journey.find((item) => at >= item.start && at < item.end) ?? journey[journey.length - 1];
  return { ...segment, stageIndex: STAGES.findIndex((stage) => stage.id === segment.stage) };
}

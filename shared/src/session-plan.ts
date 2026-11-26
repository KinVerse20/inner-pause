import { CHAKRA_IDS, type CardChakraId } from "./cards";
import { CHAKRA_FREQUENCY_HZ } from "./tuning";

// A Pause for several feelings: one stop per centre, played one after
// another, root to crown, sharing the Pause's length. Ported from Sahil's
// createSessionPlan (packages/shared/src/session-planning.ts on
// feature/practice-guided-breathing-mindspace), with the founder's rules:
// never two tones at once, up to four stops, the length split rather than
// added to.

// Where each feeling is traditionally worked, from Sahil's emotion catalog
// (same 22 feelings as Tell's "Choose how you feel"). A traditional
// association, never a claim.
export const FEELING_CENTRES: Record<string, CardChakraId> = {
  Anxiety: "root",
  Fear: "root",
  Insecurity: "root",
  Guilt: "sacral",
  "Emotional numbness": "sacral",
  "Creative block": "sacral",
  Overwhelm: "solar-plexus",
  "Self-doubt": "solar-plexus",
  Shame: "solar-plexus",
  Powerlessness: "solar-plexus",
  Sadness: "heart",
  Grief: "heart",
  Loneliness: "heart",
  Hurt: "heart",
  Resentment: "heart",
  Frustration: "throat",
  Anger: "throat",
  "Feeling unheard": "throat",
  Confusion: "third-eye",
  Overthinking: "third-eye",
  Disconnection: "crown",
  "Lack of purpose": "crown",
};

export const MAX_PAUSE_STOPS = 4;

export interface PauseStop {
  chakraId: CardChakraId;
  hz: number;
  /** The feelings this stop is for, in the order they were picked. */
  feelings: string[];
  seconds: number;
}

/** Feelings (Tell's labels) to stops. Unknown feelings are left out; none known gives no stops. */
export function planFeelingStops(feelings: string[], totalSeconds: number): PauseStop[] {
  const picked = [...new Set(feelings)].filter((feeling) => FEELING_CENTRES[feeling]);
  const centres = CHAKRA_IDS.filter((id) => picked.some((feeling) => FEELING_CENTRES[feeling] === id)).slice(0, MAX_PAUSE_STOPS);
  if (centres.length === 0) return [];
  const each = Math.floor(totalSeconds / centres.length);
  return centres.map((chakraId, index) => ({
    chakraId,
    hz: CHAKRA_FREQUENCY_HZ[chakraId],
    feelings: picked.filter((feeling) => FEELING_CENTRES[feeling] === chakraId),
    // Whole seconds; the last stop takes any remainder so the total holds.
    seconds: index === centres.length - 1 ? totalSeconds - each * (centres.length - 1) : each,
  }));
}

/** The stop playing `elapsed` seconds into a Pause, and where it began. */
export function stopAt<T extends { seconds: number }>(stops: T[], elapsed: number) {
  let startsAt = 0;
  for (let index = 0; index < stops.length; index++) {
    const end = startsAt + stops[index].seconds;
    if (elapsed < end || index === stops.length - 1) return { index, stop: stops[index], startsAt };
    startsAt = end;
  }
  return null;
}

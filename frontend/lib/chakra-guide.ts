import type { ChakraId } from "@/lib/types";

// The seven energy centres: a reading space for people who want to know
// more. Knowledge drawn from Kinverse's chakra guide
// (feature/practice-guided-breathing-mindspace), rewritten in our voice
// (DESIGN_SYSTEM.md §14: human, calm, plain, second person, no dashes, no
// jargon left unexplained). Always optional; chakra information supports
// the Pause, it never becomes it (DESIGN_SYSTEM.md §9).

export interface ChakraGuideEntry {
  id: ChakraId;
  /** Display name, e.g. "Heart". */
  name: string;
  /** Our own association line (data/chakras.ts "meaning"). */
  theme: string;
  /** Traditional color, used only as a small accent and a soft wash. */
  color: string;
  frequencyHz: number;
  about: string;
  off: string;
  pause: string;
}

export const CHAKRA_GUIDE: ChakraGuideEntry[] = [
  {
    id: "crown",
    name: "Crown",
    theme: "Presence, spaciousness and peace",
    color: "#8d64bd",
    frequencyHz: 963,
    about: "Traditionally, the crown is about presence. Feeling part of something larger than this moment, and at peace with it.",
    off: "You might feel distant from yourself, or unsure what any of it is for.",
    pause: "Sleep Pauses rest on 963 Hz, a high, open tone that leaves room to let go of the day.",
  },
  {
    id: "third-eye",
    name: "Third eye",
    theme: "Insight, reflection and intuition",
    color: "#6665bd",
    frequencyHz: 852,
    about: "Traditionally, the third eye is about seeing clearly. Perspective, reflection, and trusting what you already know.",
    off: "Thoughts can loop, decisions feel heavy, and your mind feels crowded.",
    pause: "Focus Pauses use 852 Hz to help clear a little space to think.",
  },
  {
    id: "throat",
    name: "Throat",
    theme: "Expression, honesty and resonance",
    color: "#4499c7",
    frequencyHz: 741,
    about: "Traditionally, the throat is about your voice. Saying what you mean, and feeling heard when you do.",
    off: "Words can feel stuck, or come out sharper than you meant them to.",
    pause: "A Pause tuned to 741 Hz gives your voice a little more room.",
  },
  {
    id: "heart",
    name: "Heart",
    theme: "Compassion, balance and connection",
    color: "#4eaa75",
    frequencyHz: 639,
    about: "Traditionally, the heart is about connection. Love, belonging, and being as kind to yourself as you are to others.",
    off: "You might feel lonely, guarded, or weighed down by something you lost.",
    pause: "Calm Pauses rest on 639 Hz, a warm tone for softening and settling.",
  },
  {
    id: "solar-plexus",
    name: "Solar plexus",
    theme: "Confidence, will and clarity",
    color: "#d4a128",
    frequencyHz: 528,
    about: "Traditionally, the solar plexus is about your inner strength. Believing in yourself, and making your own choices.",
    off: "Self-doubt gets louder, and small things can start to feel like too much.",
    pause: "Confidence Pauses are tuned to 528 Hz to help you stand a little taller.",
  },
  {
    id: "sacral",
    name: "Sacral",
    theme: "Flow, feeling and creativity",
    color: "#d7823d",
    frequencyHz: 417,
    about: "Traditionally, the sacral is about feeling. Letting emotions move, and staying creative and open to change.",
    off: "Feelings can seem stuck or muted, as if nothing quite moves.",
    pause: "Release Pauses use 417 Hz to help what you are holding begin to move.",
  },
  {
    id: "root",
    name: "Root",
    theme: "Grounding, safety and belonging",
    color: "#c45b5b",
    frequencyHz: 396,
    about: "Traditionally, the root is about feeling safe and steady. Knowing you are supported, with your feet on the ground.",
    off: "Life can feel rushed or uncertain, like there is nothing solid underfoot.",
    pause: "Reset Pauses and the Ground Pause rest on 396 Hz, a low, even tone that helps you land.",
  },
];

export function findChakra(id: string | null | undefined): ChakraGuideEntry | undefined {
  return CHAKRA_GUIDE.find((entry) => entry.id === id);
}

/** "Heart Chakra" / "Heart chakra" / "Heart" → "heart". */
export function chakraIdFromName(name: string | null | undefined): ChakraId | undefined {
  if (!name) return undefined;
  const short = name.replace(/\s*chakra$/i, "").trim().toLowerCase();
  return CHAKRA_GUIDE.find((entry) => entry.name.toLowerCase() === short)?.id;
}

export const CHAKRA_INTRO =
  "In old sound and energy traditions, the body has seven centres, each linked to a feeling and a frequency. Every Pause is tuned to one of them. Read as much or as little as you like.";

export const CHAKRA_NOTE = "These are traditional ideas, offered as a gentle way to reflect. Inner Pause is not medical care.";

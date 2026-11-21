import { ChakraDefinition, ChakraId, MoodValue, QuickPlayDuration, RelaxMoodDefinition } from "@/lib/types";
import { getChakraFrequencyLabel } from "@/lib/chakra-audio";

const sessionTemplates = [
  {
    id: "introduction",
    type: "introduction" as const,
    durationMinutes: 5,
    suffix: "Arrival",
  },
  {
    id: "breathing",
    type: "breathing" as const,
    durationMinutes: 10,
    suffix: "Breath",
  },
  {
    id: "focus",
    type: "focus" as const,
    durationMinutes: 10,
    suffix: "Focus",
  },
  {
    id: "affirmation",
    type: "affirmation" as const,
    durationMinutes: 15,
    suffix: "Affirmation",
  },
  {
    id: "completion",
    type: "completion" as const,
    durationMinutes: 20,
    suffix: "Completion Ritual",
  },
];

const chakraBase = [
  {
    id: "root" as ChakraId,
    name: "Root Chakra",
    meaning: "Grounding, safety and belonging",
    purpose: "Settle the body, feel supported and return to steadiness.",
    frequencyLabel: getChakraFrequencyLabel("root"),
    color: "#C4473A",
    accent: "#F1B27A",
    glow: "rgba(196,71,58,0.45)",
    gradient: "from-rose-950 via-red-900 to-amber-900",
    audioPath: "/audio/root.mp3",
    badge: "Grounded Soul",
    affirmations: [
      "I am safe in this moment.",
      "My breath anchors me to the earth.",
      "Stability grows gently within me.",
      "I trust my foundation.",
    ],
  },
  {
    id: "sacral" as ChakraId,
    name: "Sacral Chakra",
    meaning: "Flow, feeling and creativity",
    purpose: "Loosen tension, welcome feeling and restore creative motion.",
    frequencyLabel: getChakraFrequencyLabel("sacral"),
    color: "#E67A2E",
    accent: "#F6D98D",
    glow: "rgba(230,122,46,0.45)",
    gradient: "from-orange-950 via-orange-800 to-amber-700",
    audioPath: "/audio/sacral.mp3",
    badge: "Creative Flow",
    affirmations: [
      "I allow energy to move with ease.",
      "I make space for feeling and joy.",
      "Creative warmth lives within me.",
      "I soften and let life flow.",
    ],
  },
  {
    id: "solar-plexus" as ChakraId,
    name: "Solar Plexus Chakra",
    meaning: "Confidence, will and clarity",
    purpose: "Strengthen inner resolve and reconnect with personal direction.",
    frequencyLabel: getChakraFrequencyLabel("solar-plexus"),
    color: "#E0A72F",
    accent: "#FBEAA7",
    glow: "rgba(224,167,47,0.45)",
    gradient: "from-amber-950 via-yellow-800 to-orange-700",
    audioPath: "/audio/solar-plexus.mp3",
    badge: "Inner Strength",
    affirmations: [
      "I act with calm confidence.",
      "My energy is clear and steady.",
      "I trust my inner strength.",
      "Purpose rises naturally in me.",
    ],
  },
  {
    id: "heart" as ChakraId,
    name: "Heart Chakra",
    meaning: "Compassion, balance and connection",
    purpose: "Open gently to warmth, forgiveness and emotional balance.",
    frequencyLabel: getChakraFrequencyLabel("heart"),
    color: "#4F9B63",
    accent: "#C9E7B0",
    glow: "rgba(79,155,99,0.45)",
    gradient: "from-emerald-950 via-green-800 to-lime-700",
    audioPath: "/audio/heart.mp3",
    badge: "Open Heart",
    affirmations: [
      "I meet myself with kindness.",
      "My heart is steady and open.",
      "Compassion moves through me softly.",
      "I give and receive peace.",
    ],
  },
  {
    id: "throat" as ChakraId,
    name: "Throat Chakra",
    meaning: "Expression, honesty and resonance",
    purpose: "Release pressure and make room for a clear inner voice.",
    frequencyLabel: getChakraFrequencyLabel("throat"),
    color: "#4B7DD6",
    accent: "#B8D7F8",
    glow: "rgba(75,125,214,0.45)",
    gradient: "from-sky-950 via-blue-800 to-cyan-700",
    audioPath: "/audio/throat.mp3",
    badge: "True Voice",
    affirmations: [
      "My voice can be calm and true.",
      "I express myself with ease.",
      "Clarity arrives with each breath.",
      "I listen inward before I speak.",
    ],
  },
  {
    id: "third-eye" as ChakraId,
    name: "Third Eye Chakra",
    meaning: "Insight, reflection and intuition",
    purpose: "Create inner stillness and notice what becomes clear.",
    frequencyLabel: getChakraFrequencyLabel("third-eye"),
    color: "#6D57C8",
    accent: "#D6C6FF",
    glow: "rgba(109,87,200,0.45)",
    gradient: "from-indigo-950 via-violet-800 to-purple-700",
    audioPath: "/audio/third-eye.mp3",
    badge: "Clear Vision",
    affirmations: [
      "I trust quiet inner knowing.",
      "Stillness helps me see clearly.",
      "My awareness is soft and sharp.",
      "Insight grows in silence.",
    ],
  },
  {
    id: "crown" as ChakraId,
    name: "Crown Chakra",
    meaning: "Presence, spaciousness and peace",
    purpose: "Rest in spacious awareness and end the journey with quiet peace.",
    frequencyLabel: getChakraFrequencyLabel("crown"),
    color: "#9A68D2",
    accent: "#F2DCF8",
    glow: "rgba(154,104,210,0.45)",
    gradient: "from-violet-950 via-fuchsia-800 to-purple-700",
    audioPath: "/audio/crown.mp3",
    badge: "Inner Peace",
    affirmations: [
      "I rest in gentle presence.",
      "Peace expands around and within me.",
      "I welcome quiet spaciousness.",
      "I am connected to stillness.",
    ],
  },
];

export const moods: { value: MoodValue; label: string; score: number }[] = [
  { value: "very-low", label: "Very low", score: 1 },
  { value: "low", label: "Low", score: 2 },
  { value: "neutral", label: "Neutral", score: 3 },
  { value: "good", label: "Good", score: 4 },
  { value: "very-good", label: "Very good", score: 5 },
];

export const chakras: ChakraDefinition[] = chakraBase.map((chakra, chakraIndex) => ({
  ...chakra,
  index: chakraIndex,
  sessions: sessionTemplates.map((template, sessionIndex) => ({
    id: template.id,
    index: sessionIndex,
    type: template.type,
    name: `${chakra.name.replace(" Chakra", "")} ${template.suffix}`,
    durationMinutes: template.durationMinutes,
    mission:
      template.type === "introduction"
        ? `Arrive gently in the ${chakra.name.toLowerCase()}.`
        : template.type === "breathing"
          ? `Use the breath to support ${chakra.meaning.toLowerCase()}.`
          : template.type === "focus"
            ? `Hold calm attention on ${chakra.purpose.toLowerCase()}`
            : template.type === "affirmation"
              ? `Repeat steady thoughts that support ${chakra.meaning.toLowerCase()}.`
              : `Close this stage of the journey with quiet intention.`,
    instructions:
      template.type === "introduction"
        ? `Settle your posture and notice what ${chakra.name.toLowerCase()} needs today.`
        : template.type === "breathing"
          ? `Follow the breath cycle and let each round soften the body.`
          : template.type === "focus"
            ? `Rest attention on the center of this chakra and return gently when the mind wanders.`
            : template.type === "affirmation"
              ? `Let the affirmations land slowly and repeat the words that feel useful.`
              : `Let the music carry you into a calm closing ritual for this chakra.`,
    prompts: [
      chakra.affirmations[0],
      chakra.affirmations[1],
      chakra.purpose,
      chakra.affirmations[2],
      chakra.affirmations[3],
    ],
    breathingPattern: template.type === "breathing",
  })),
}));

export const chakraMap = Object.fromEntries(chakras.map((chakra) => [chakra.id, chakra]));

export const relaxMoods: RelaxMoodDefinition[] = [
  {
    id: "calm",
    label: "Calm",
    chakraId: "heart",
    description: "Slow down and settle.",
    icon: "☾",
    color: "#7BCFA0",
    explanation: "This music is meant to help you slow down, relax your breathing and feel emotionally settled.",
    supportText: "It creates a softer pace so your mind and body can ease out of tension.",
  },
  {
    id: "sleep",
    label: "Sleep",
    chakraId: "crown",
    description: "Quiet down for rest.",
    icon: "✦",
    color: "#C49AF2",
    explanation: "This music is meant to quiet mental noise and help your body move into a more restful state.",
    supportText: "It gives your attention less to hold onto so it is easier to unwind.",
  },
  {
    id: "focus",
    label: "Focus",
    chakraId: "third-eye",
    description: "Clear distractions.",
    icon: "◉",
    color: "#8C7AF5",
    explanation: "This music is meant to reduce distractions and help you stay mentally present.",
    supportText: "It gives you a steady background so your attention can stay with one thing.",
  },
  {
    id: "grounded",
    label: "Grounded",
    chakraId: "root",
    description: "Feel stable and steady.",
    icon: "◆",
    color: "#D56A58",
    explanation: "This music is meant to help you feel stable, steady and more connected to the present moment.",
    supportText: "It supports a slower rhythm that can make you feel more anchored.",
  },
  {
    id: "positive",
    label: "Positive",
    chakraId: "solar-plexus",
    description: "Lift your mood gently.",
    icon: "☀",
    color: "#E6BE53",
    explanation: "This music is meant to create a warmer, more uplifting mood and support confidence.",
    supportText: "It adds brightness and momentum without making the experience feel intense.",
  },
  {
    id: "emotionally-lighter",
    label: "Emotionally lighter",
    chakraId: "sacral",
    description: "Release some heaviness.",
    icon: "≈",
    color: "#F0A25D",
    explanation: "This music is meant to help you relax emotional tension and feel less mentally heavy.",
    supportText: "It encourages a looser, lighter emotional state when you feel stuck or weighed down.",
  },
  {
    id: "confidence",
    label: "Confidence",
    chakraId: "solar-plexus",
    description: "Support motivation.",
    icon: "▲",
    color: "#E6BE53",
    explanation: "This music is meant to support a stronger, more motivated and self-assured state.",
    supportText: "It helps create a steadier internal push when you want more belief in yourself.",
  },
  {
    id: "express-myself",
    label: "Express myself",
    chakraId: "throat",
    description: "Clear thoughts and speak more easily.",
    icon: "☁",
    color: "#73B8F7",
    explanation: "This music is meant to help you slow down, clear your thoughts and feel more comfortable expressing yourself.",
    supportText: "It makes the mental space feel less crowded so words can come more naturally.",
  },
];

export const relaxMoodMap = Object.fromEntries(relaxMoods.map((mood) => [mood.id, mood]));

export const quickPlayDurations: { value: QuickPlayDuration; label: string }[] = [
  { value: 10, label: "10 minutes" },
  { value: 20, label: "20 minutes" },
  { value: 30, label: "30 minutes" },
  { value: "keep-playing", label: "Keep playing" },
];

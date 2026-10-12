import type { PauseCategoryId } from "@/lib/pause-categories";
import type { PracticeSkillId } from "@/lib/practice-skills";

// Authored Practice content (docs/PRODUCT_FLOW.md §18): a finite Core
// Practice Arc per skill, plus a small reusable pool for Ongoing Practice
// once that arc is exhausted — never an ever-growing authored list, never
// generated on the fly. Only Confidence is populated this slice; the shape
// is skill-agnostic so the other six skills can be authored later without
// touching the engine (lib/practice-engine.ts).

export type PracticeActivityType =
  | "reflection"
  | "observation"
  | "behavioural-rep"
  | "communication-action"
  | "reframing"
  | "decision-exercise";

export interface PracticeActivity {
  type: PracticeActivityType;
  prompt: string;
  /** A small, concrete real-world action, where appropriate (this slice's brief §7) — not every session has one. */
  realWorldRep?: string;
}

export interface PracticeSessionContent {
  sessionNumber: number;
  title: string;
  /** Arrival is shown before playback, never during (same rule as Core Pause — docs/PRODUCT_FLOW.md §7). */
  arrivalGuidance: string[];
  categoryId: PauseCategoryId;
  durationSeconds: number;
  activity: PracticeActivity;
}

const CONFIDENCE_CORE_ARC: PracticeSessionContent[] = [
  {
    sessionNumber: 1,
    title: "Notice the Moment",
    arrivalGuidance: ["Get comfortable.", "Let yourself arrive here."],
    categoryId: "confidence",
    durationSeconds: 5 * 60,
    activity: {
      type: "observation",
      prompt: "Think of a recent moment you doubted yourself. Without judging it, just notice: what actually happened, and what did you tell yourself about it?",
    },
  },
  {
    sessionNumber: 2,
    title: "Reframe the Story",
    arrivalGuidance: ["Settle in.", "There's nothing you need to prove right now."],
    categoryId: "confidence",
    durationSeconds: 5 * 60,
    activity: {
      type: "reframing",
      prompt: "Take that same moment. If a friend told you this story about themselves, what would you actually think of them? Write the story again from that angle.",
    },
  },
  {
    sessionNumber: 3,
    title: "Say It Plainly",
    arrivalGuidance: ["Get comfortable.", "Give yourself a little room to be as you are."],
    categoryId: "confidence",
    durationSeconds: 5 * 60,
    activity: {
      type: "communication-action",
      prompt: "Confidence often shows up in small, unsoftened moments. Pick one thing you'll say plainly today, without qualifying it.",
      realWorldRep: "Today, say what you think once without softening it.",
    },
  },
  {
    sessionNumber: 4,
    title: "Decide Without Approval",
    arrivalGuidance: ["Settle in.", "Bring your attention back to this moment."],
    categoryId: "confidence",
    durationSeconds: 6 * 60,
    activity: {
      type: "decision-exercise",
      prompt: "Pick one small decision you've been running past other people. Decide it here, on your own, before you talk to anyone else about it.",
      realWorldRep: "Make that one small decision today without seeking approval first.",
    },
  },
  {
    sessionNumber: 5,
    title: "What's Different Now",
    arrivalGuidance: ["Get comfortable.", "You don't have to hold on to everything right now."],
    categoryId: "confidence",
    durationSeconds: 6 * 60,
    activity: {
      type: "reflection",
      prompt: "Looking back at this arc: what's one way you've shown up differently, even slightly?",
      realWorldRep: "Speak up once today in a moment you'd normally stay quiet.",
    },
  },
];

// Ongoing Practice (docs/PRODUCT_FLOW.md §18): once the Core Arc is
// exhausted, sessions draw from this small reusable pool — variations and
// reps, not new authored content each time (this slice's brief §11).
const CONFIDENCE_ONGOING_POOL: PracticeActivity[] = [
  { type: "observation", prompt: "Notice one moment today where you felt a flicker of confidence, even briefly. What was different about it?" },
  { type: "communication-action", prompt: "Confidence is built in small unsoftened moments.", realWorldRep: "Say what you think once today without softening it." },
  { type: "reframing", prompt: "Take one self-doubting thought from today and rewrite it the way you'd say it to someone you respect." },
  { type: "decision-exercise", prompt: "Pick one small decision today and make it without seeking approval first.", realWorldRep: "Make that decision before you check in with anyone else." },
  { type: "reflection", prompt: "What's one way you've grown since you started practicing this skill?" },
];

const SELF_TRUST_CORE_ARC: PracticeSessionContent[] = [
  {
    sessionNumber: 1,
    title: "Notice Where You Doubt Yourself",
    arrivalGuidance: ["Settle in.", "There is nothing you need to prove right now."],
    categoryId: "reset",
    durationSeconds: 5 * 60,
    activity: {
      type: "observation",
      prompt: "Think of a recent moment you second-guessed your own judgment and deferred to someone else instead. What did you actually know, underneath the doubt?",
    },
  },
  {
    sessionNumber: 2,
    title: "Trust What You Already Know",
    arrivalGuidance: ["Settle in.", "There is nothing you need to prove right now."],
    categoryId: "reset",
    durationSeconds: 5 * 60,
    activity: {
      type: "reframing",
      prompt: "Take that same moment. What would it have looked like to trust your first instinct, even briefly? Write it from that angle.",
    },
  },
  {
    sessionNumber: 3,
    title: "Decide Without Checking",
    arrivalGuidance: ["Settle in.", "There is nothing you need to prove right now."],
    categoryId: "reset",
    durationSeconds: 6 * 60,
    activity: {
      type: "decision-exercise",
      prompt: "Pick one small decision today. Make it and act on it before asking anyone else what they think.",
      realWorldRep: "Make one decision today without checking it with someone else first.",
    },
  },
  {
    sessionNumber: 4,
    title: "What You're Learning to Trust",
    arrivalGuidance: ["Settle in.", "There is nothing you need to prove right now."],
    categoryId: "reset",
    durationSeconds: 6 * 60,
    activity: {
      type: "reflection",
      prompt: "Looking back: what's one thing you've trusted yourself on that you wouldn't have a few sessions ago?",
      realWorldRep: "Notice one moment today where you trusted your own read on something.",
    },
  },
];

const SELF_TRUST_ONGOING_POOL: PracticeActivity[] = [
  { type: "observation", prompt: "Notice one moment today you deferred to someone else's opinion over your own. What did you actually think?" },
  { type: "decision-exercise", prompt: "Pick one small decision today and make it without checking it with anyone else first.", realWorldRep: "Make that decision before asking anyone else." },
  { type: "reframing", prompt: "Take one moment of self-doubt from today and rewrite it the way you'd say it if you trusted yourself." },
  { type: "reflection", prompt: "What's one way you've come to trust your own judgment more since you started?" },
];

const UNCERTAINTY_CORE_ARC: PracticeSessionContent[] = [
  {
    sessionNumber: 1,
    title: "Notice the Need to Know",
    arrivalGuidance: ["Get comfortable.", "Let things be unclear for a moment."],
    categoryId: "focus",
    durationSeconds: 5 * 60,
    activity: {
      type: "observation",
      prompt: "Think of something unresolved right now that you keep trying to figure out. Notice the urge to solve it immediately, without acting on that urge yet.",
    },
  },
  {
    sessionNumber: 2,
    title: "Sit With Not Knowing",
    arrivalGuidance: ["Get comfortable.", "Let things be unclear for a moment."],
    categoryId: "focus",
    durationSeconds: 5 * 60,
    activity: {
      type: "reflection",
      prompt: "What would it feel like to let this stay unresolved a little longer, without treating that as a failure? Write what changes if you allow that.",
    },
  },
  {
    sessionNumber: 3,
    title: "Act on Partial Information",
    arrivalGuidance: ["Get comfortable.", "Let things be unclear for a moment."],
    categoryId: "focus",
    durationSeconds: 6 * 60,
    activity: {
      type: "decision-exercise",
      prompt: "Pick one thing you've been waiting for full clarity on. Take one small step today with the information you already have.",
      realWorldRep: "Take one small step today on something you don't have full clarity on yet.",
    },
  },
  {
    sessionNumber: 4,
    title: "What Became Clear By Moving",
    arrivalGuidance: ["Get comfortable.", "Let things be unclear for a moment."],
    categoryId: "focus",
    durationSeconds: 6 * 60,
    activity: {
      type: "reflection",
      prompt: "Looking back: what's something that only became clearer once you moved, rather than by waiting?",
      realWorldRep: "Notice one moment today where acting taught you something waiting couldn't have.",
    },
  },
];

const UNCERTAINTY_ONGOING_POOL: PracticeActivity[] = [
  { type: "observation", prompt: "Notice one thing today you're tempted to over-plan. What would it look like to let it stay a little open?" },
  { type: "decision-exercise", prompt: "Take one small step today on something you don't have full clarity on yet.", realWorldRep: "Move on it before you feel fully ready." },
  { type: "reflection", prompt: "What's something uncertain right now that you're learning to sit with instead of solving immediately?" },
  { type: "observation", prompt: "Notice one moment today where not knowing turned out to be okay." },
];

const EMOTIONAL_REGULATION_CORE_ARC: PracticeSessionContent[] = [
  {
    sessionNumber: 1,
    title: "Notice the Wave",
    arrivalGuidance: ["Take a moment to settle.", "Notice what you're carrying."],
    categoryId: "calm",
    durationSeconds: 5 * 60,
    activity: {
      type: "observation",
      prompt: "Think of a recent moment a strong feeling took over. Without judging it, notice: where did you feel it in your body, and how long did it actually last?",
    },
  },
  {
    sessionNumber: 2,
    title: "Name What's There",
    arrivalGuidance: ["Take a moment to settle.", "Notice what you're carrying."],
    categoryId: "calm",
    durationSeconds: 5 * 60,
    activity: {
      type: "reflection",
      prompt: "Strong feelings often shrink when they're named plainly. Take a feeling you're carrying right now and describe it in one honest sentence, nothing more.",
    },
  },
  {
    sessionNumber: 3,
    title: "Pause Before Reacting",
    arrivalGuidance: ["Take a moment to settle.", "Notice what you're carrying."],
    categoryId: "calm",
    durationSeconds: 6 * 60,
    activity: {
      type: "behavioural-rep",
      prompt: "Pick one situation today that tends to trigger a fast reaction. Practice pausing for one breath before you respond.",
      realWorldRep: "Take one full breath before reacting the next time something triggers you.",
    },
  },
  {
    sessionNumber: 4,
    title: "What's Different Now",
    arrivalGuidance: ["Take a moment to settle.", "Notice what you're carrying."],
    categoryId: "calm",
    durationSeconds: 6 * 60,
    activity: {
      type: "reflection",
      prompt: "Looking back: is there a feeling that used to sweep you away that you can now just notice and let move through?",
      realWorldRep: "Notice one strong feeling today without immediately acting on it.",
    },
  },
];

const EMOTIONAL_REGULATION_ONGOING_POOL: PracticeActivity[] = [
  { type: "observation", prompt: "Notice one strong feeling today. Where do you feel it in your body?" },
  { type: "behavioural-rep", prompt: "Practice one full breath before reacting the next time something triggers you.", realWorldRep: "Pause for one breath before responding." },
  { type: "reflection", prompt: "What's a feeling that used to overwhelm you that you can now just notice?" },
  { type: "reframing", prompt: "Take one strong reaction from today and describe what was underneath it, plainly." },
];

const LETTING_GO_CORE_ARC: PracticeSessionContent[] = [
  {
    sessionNumber: 1,
    title: "Notice What You're Holding",
    arrivalGuidance: ["Get comfortable.", "You do not have to hold on to everything right now."],
    categoryId: "release",
    durationSeconds: 5 * 60,
    activity: {
      type: "observation",
      prompt: "Think of something you're still carrying: an old conversation, a decision, a regret. Just notice its weight, without trying to resolve it yet.",
    },
  },
  {
    sessionNumber: 2,
    title: "Ask What It's Costing You",
    arrivalGuidance: ["Get comfortable.", "You do not have to hold on to everything right now."],
    categoryId: "release",
    durationSeconds: 5 * 60,
    activity: {
      type: "reflection",
      prompt: "What is holding onto this actually giving you? What is it costing you to keep carrying it?",
    },
  },
  {
    sessionNumber: 3,
    title: "Set One Thing Down",
    arrivalGuidance: ["Get comfortable.", "You do not have to hold on to everything right now."],
    categoryId: "release",
    durationSeconds: 6 * 60,
    activity: {
      type: "behavioural-rep",
      prompt: "Pick one small thing you're ready to stop carrying today, even if it's not fully resolved.",
      realWorldRep: "Today, consciously set down one thing you've been carrying, even if only for an hour.",
    },
  },
  {
    sessionNumber: 4,
    title: "What's Lighter Now",
    arrivalGuidance: ["Get comfortable.", "You do not have to hold on to everything right now."],
    categoryId: "release",
    durationSeconds: 6 * 60,
    activity: {
      type: "reflection",
      prompt: "Looking back: what's something that feels lighter to carry now than when you started?",
      realWorldRep: "Notice one moment today where you let something go instead of holding on.",
    },
  },
];

const LETTING_GO_ONGOING_POOL: PracticeActivity[] = [
  { type: "observation", prompt: "Notice one thing you're still carrying today. Just notice its weight." },
  { type: "behavioural-rep", prompt: "Consciously set down one thing you've been holding onto, even briefly.", realWorldRep: "Set it down for at least an hour today." },
  { type: "reflection", prompt: "What's something that feels lighter to carry than it used to?" },
  { type: "reframing", prompt: "Take one thing you're holding onto and ask what it's costing you to keep carrying it." },
];

const PRESENCE_CORE_ARC: PracticeSessionContent[] = [
  {
    sessionNumber: 1,
    title: "Notice Where Your Mind Goes",
    arrivalGuidance: ["Settle in.", "Bring your attention back to this moment."],
    categoryId: "reset",
    durationSeconds: 5 * 60,
    activity: {
      type: "observation",
      prompt: "For a moment, notice where your attention usually goes: the past, the future, or somewhere else entirely. Just notice, without trying to fix it.",
    },
  },
  {
    sessionNumber: 2,
    title: "Come Back to Here",
    arrivalGuidance: ["Settle in.", "Bring your attention back to this moment."],
    categoryId: "reset",
    durationSeconds: 5 * 60,
    activity: {
      type: "reflection",
      prompt: "Pick one ordinary moment today: a meal, a walk, a conversation. What would it be like to give it your full attention, just once?",
    },
  },
  {
    sessionNumber: 3,
    title: "One Fully Present Moment",
    arrivalGuidance: ["Settle in.", "Bring your attention back to this moment."],
    categoryId: "reset",
    durationSeconds: 6 * 60,
    activity: {
      type: "behavioural-rep",
      prompt: "Choose one activity today and do it without your phone, without multitasking, fully there.",
      realWorldRep: "Spend one activity today fully present, without splitting your attention.",
    },
  },
  {
    sessionNumber: 4,
    title: "What You Notice When You're Here",
    arrivalGuidance: ["Settle in.", "Bring your attention back to this moment."],
    categoryId: "reset",
    durationSeconds: 6 * 60,
    activity: {
      type: "reflection",
      prompt: "Looking back: what's something you've started noticing now that you might have missed before?",
      realWorldRep: "Notice one thing today you would have missed if you weren't paying attention.",
    },
  },
];

const PRESENCE_ONGOING_POOL: PracticeActivity[] = [
  { type: "observation", prompt: "Notice where your attention goes most today: past, future, or here." },
  { type: "behavioural-rep", prompt: "Spend one activity today fully present, without splitting your attention.", realWorldRep: "Choose one ordinary moment and give it your full attention." },
  { type: "reflection", prompt: "What's something you've started noticing now that you might have missed before?" },
  { type: "observation", prompt: "Notice one moment today you were fully here, even briefly." },
];

const SELF_COMPASSION_CORE_ARC: PracticeSessionContent[] = [
  {
    sessionNumber: 1,
    title: "Notice the Voice",
    arrivalGuidance: ["Get comfortable.", "Give yourself a little room to be as you are."],
    categoryId: "calm",
    durationSeconds: 5 * 60,
    activity: {
      type: "observation",
      prompt: "Think of something you got wrong recently. Notice how you spoke to yourself about it, and whether you'd ever speak to someone else that way.",
    },
  },
  {
    sessionNumber: 2,
    title: "Speak to Yourself Like Someone You Love",
    arrivalGuidance: ["Get comfortable.", "Give yourself a little room to be as you are."],
    categoryId: "calm",
    durationSeconds: 5 * 60,
    activity: {
      type: "reframing",
      prompt: "Take that same moment. Rewrite what you told yourself, but the way you'd comfort a close friend going through the same thing.",
    },
  },
  {
    sessionNumber: 3,
    title: "Offer Yourself Rest",
    arrivalGuidance: ["Get comfortable.", "Give yourself a little room to be as you are."],
    categoryId: "calm",
    durationSeconds: 6 * 60,
    activity: {
      type: "behavioural-rep",
      prompt: "Pick one thing today you'd normally push through without a break. Let yourself rest instead, without earning it first.",
      realWorldRep: "Give yourself one break today without needing to earn it first.",
    },
  },
  {
    sessionNumber: 4,
    title: "What Kindness Has Changed",
    arrivalGuidance: ["Get comfortable.", "Give yourself a little room to be as you are."],
    categoryId: "calm",
    durationSeconds: 6 * 60,
    activity: {
      type: "reflection",
      prompt: "Looking back: is there a way you treat yourself differently now than when you started?",
      realWorldRep: "Notice one moment today where you were gentler with yourself than usual.",
    },
  },
];

const SELF_COMPASSION_ONGOING_POOL: PracticeActivity[] = [
  { type: "observation", prompt: "Notice how you spoke to yourself about something today. Would you say that to someone you love?" },
  { type: "reframing", prompt: "Take one harsh thought about yourself from today and rewrite it the way you'd comfort a friend." },
  { type: "behavioural-rep", prompt: "Give yourself one break today without needing to earn it first.", realWorldRep: "Let yourself rest without justifying it." },
  { type: "reflection", prompt: "What's a way you've been gentler with yourself since you started this practice?" },
];

const CORE_ARCS: Partial<Record<PracticeSkillId, PracticeSessionContent[]>> = {
  confidence: CONFIDENCE_CORE_ARC,
  "self-trust": SELF_TRUST_CORE_ARC,
  uncertainty: UNCERTAINTY_CORE_ARC,
  "emotional-regulation": EMOTIONAL_REGULATION_CORE_ARC,
  "letting-go": LETTING_GO_CORE_ARC,
  presence: PRESENCE_CORE_ARC,
  "self-compassion": SELF_COMPASSION_CORE_ARC,
};

const ONGOING_POOLS: Partial<Record<PracticeSkillId, PracticeActivity[]>> = {
  confidence: CONFIDENCE_ONGOING_POOL,
  "self-trust": SELF_TRUST_ONGOING_POOL,
  uncertainty: UNCERTAINTY_ONGOING_POOL,
  "emotional-regulation": EMOTIONAL_REGULATION_ONGOING_POOL,
  "letting-go": LETTING_GO_ONGOING_POOL,
  presence: PRESENCE_ONGOING_POOL,
  "self-compassion": SELF_COMPASSION_ONGOING_POOL,
};

// Deterministic default sound category per skill (docs/PRODUCT_FLOW.md §5's
// existing six-category mapping, reused as-is — never a new mapping
// invented for Practice). Confidence keeps its own chakra (solar plexus);
// the other six map onto the closest traditional association among the six
// existing categories, doubling up where two skills share a natural theme
// (self-trust/presence both root; emotional-regulation/self-compassion
// both heart) rather than inventing a seventh.
export const SKILL_DEFAULT_CATEGORY: Record<PracticeSkillId, PauseCategoryId> = {
  confidence: "confidence",
  "self-trust": "reset",
  uncertainty: "focus",
  "emotional-regulation": "calm",
  "letting-go": "release",
  presence: "reset",
  "self-compassion": "calm",
};

// Skill-level arrival copy (Practice Completion pass §8) — used for every
// session of that skill, Core Arc and Ongoing alike, unless a specific Core
// Arc session authors its own (Confidence's arc does, above; the other six
// use this directly). One line per skill is sufficient — it doesn't need to
// vary per session to be "skill/context-aware."
export const SKILL_ARRIVAL_GUIDANCE: Record<PracticeSkillId, string[]> = {
  confidence: ["Get comfortable.", "Let yourself arrive here."],
  "self-trust": ["Settle in.", "There is nothing you need to prove right now."],
  uncertainty: ["Get comfortable.", "Let things be unclear for a moment."],
  "emotional-regulation": ["Take a moment to settle.", "Notice what you're carrying."],
  "letting-go": ["Get comfortable.", "You do not have to hold on to everything right now."],
  presence: ["Settle in.", "Bring your attention back to this moment."],
  "self-compassion": ["Get comfortable.", "Give yourself a little room to be as you are."],
};

export function getCoreArc(skillId: PracticeSkillId): PracticeSessionContent[] {
  return CORE_ARCS[skillId] ?? [];
}

export function getOngoingPool(skillId: PracticeSkillId): PracticeActivity[] {
  return ONGOING_POOLS[skillId] ?? [];
}

// Check-in content (docs/PRODUCT_FLOW.md §20) — one simple prompt per tier,
// never a questionnaire. Skill-agnostic; tone stays the same across skills.
export type CheckInTier = "fit" | "early-signal" | "progress" | "adaptation";

export interface CheckInContent {
  tier: CheckInTier;
  prompt: string;
  /** Optional lightweight tap choices — still "one prompt," not a form. */
  options?: string[];
}

export const CHECK_IN_CONTENT: Record<CheckInTier, CheckInContent> = {
  fit: {
    tier: "fit",
    prompt: "Does this feel like the right starting point?",
    options: ["Yes, this fits", "Not quite", "Not sure yet"],
  },
  "early-signal": {
    tier: "early-signal",
    prompt: "What's helping so far?",
    options: ["The sound", "The writing", "The exercises", "Just showing up"],
  },
  progress: {
    tier: "progress",
    prompt: "How does this feel different from when you started?",
  },
  adaptation: {
    tier: "adaptation",
    prompt: "What should change going forward?",
    options: ["Shorter sessions", "More sound, less writing", "More writing, less sound", "Keep going as-is"],
  },
};

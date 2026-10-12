// Shared "Why this Pause?" content — the exact four-part structure locked in
// docs/PRODUCT_FLOW.md §9 (Chakra / Frequency / Together / Why this helps).
// Used identically by the Pause Player and Tell's Recommended Pause screen
// (docs/PRODUCT_FLOW.md §9: "canonical everywhere ... not two different
// depths of disclosure") — one content builder, not two copies of this text.
//
// Strict rule (§9): never include "Modern perspective," evidence
// disclaimers, skepticism language, or scientific caveats. Every line below
// stays warm and direct on purpose.
export interface WhyThisPauseInput {
  chakraName: string;
  traditionalAssociation: string;
  frequencyLabel: string;
  intentLabel: string;
}

export interface WhyThisPauseContent {
  chakra: string;
  frequency: string;
  together: string;
  whyThisHelps: string;
}

export function buildWhyThisPauseContent(input: WhyThisPauseInput): WhyThisPauseContent {
  const shortChakraName = input.chakraName.replace(" Chakra", "");
  const intent = input.intentLabel.toLowerCase();

  return {
    chakra: `${input.chakraName} is traditionally associated with ${input.traditionalAssociation.toLowerCase()}.`,
    frequency: `The ${input.frequencyLabel} tone is part of this Pause's sound layer — chosen to complement its intent: ${intent}.`,
    together: `The ${shortChakraName} association and the ${input.frequencyLabel} tone work together here: one carries the feeling, the other carries the sound, both pointing toward the same thing — ${intent}.`,
    whyThisHelps: `This Pause is here for one simple reason: ${intent}.`,
  };
}

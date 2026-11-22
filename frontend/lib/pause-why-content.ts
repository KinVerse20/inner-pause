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
  // Sentence-safe: "Recognise doubt." → "recognise doubt" (no double period).
  const intent = input.intentLabel.trim().replace(/[.!]+$/, "").replace(/^./, (c) => c.toLowerCase());

  // Four parts, each saying one different thing (no repeated intent).
  return {
    chakra: `Traditionally, the ${shortChakraName.toLowerCase()} is linked with ${input.traditionalAssociation.toLowerCase()}.`,
    frequency: `The sound is tuned to ${input.frequencyLabel}, the tone that tradition pairs with the ${shortChakraName.toLowerCase()}.`,
    together: "The tradition sets the feeling; the frequency carries it in sound.",
    whyThisHelps: `It is here for one simple reason: to help you ${intent}.`,
  };
}

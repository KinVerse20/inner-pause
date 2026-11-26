import test from "node:test";
import assert from "node:assert/strict";

import { classifyTellInput } from "@inner-pause/shared";

// Tell understands everyday Hinglish, spelled the way Speak writes Hindi in
// English letters (frontend/tests/hinglish.test.mjs has the spelling).
const routes = [
  ["bahut ghabrahat ho rahi hai", "calm"],
  ["office mein tension ho rahi hai", "calm"],
  ["mujhe neend nahi aa rahi", "sleep"],
  ["mujhe rona aa raha hai", "release"],
  ["mujhe bahut gussa aa raha hai, sab bura lag raha hai", "release"],
  ["padhai mein dhyan nahi lag raha", "focus"],
  ["kal interview hai aur himmat nahi ho rahi", "confidence"],
  ["sab kuch ek saath ho raha hai", "reset"],
];

for (const [text, category] of routes) {
  test(`"${text}" finds the ${category} Pause`, () => {
    const result = classifyTellInput(text, []);
    assert.equal(result.primary, category, JSON.stringify(result));
  });
}

// The whole way: what the phone's Hindi recognizer writes, shown in English letters, then routed.
import { toHinglish } from "../../frontend/lib/hinglish.ts";

const spoken = [
  ["बहुत घबराहट हो रही है", "calm"],
  ["मुझे नींद नहीं आ रही", "sleep"],
  ["ऑफिस में टेंशन है", "calm"],
  ["मुझे रोना आ रहा है", "release"],
  ["पढ़ाई में ध्यान नहीं लग रहा", "focus"],
  ["सब कुछ एक साथ हो रहा है", "reset"],
];

for (const [hindi, category] of spoken) {
  test(`spoken "${hindi}" reads "${toHinglish(hindi)}" and finds the ${category} Pause`, () => {
    assert.equal(classifyTellInput(toHinglish(hindi), []).primary, category);
  });
}

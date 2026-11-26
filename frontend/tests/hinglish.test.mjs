import test from "node:test";
import assert from "node:assert/strict";

import { toHinglish } from "../lib/hinglish.ts";

// Everyday phrases as the phone's Hindi recognizer writes them, and as
// people type them. The silent "a" is the hard part: "kar", not "kara".
export const PHRASES = [
  ["आप क्या कर रहे हो", "aap kya kar rahe ho"],
  ["मुझे नींद नहीं आ रही", "mujhe neend nahi aa rahi"],
  ["बहुत घबराहट हो रही है", "bahut ghabrahat ho rahi hai"],
  ["मुझे डर लग रहा है", "mujhe dar lag raha hai"],
  ["मैं बहुत परेशान हूँ", "main bahut pareshan hoon"],
  ["दिल टूट गया", "dil toot gaya"],
  ["मुझे बहुत गुस्सा आ रहा है", "mujhe bahut gussa aa raha hai"],
  ["मैं अकेला महसूस कर रहा हूं", "main akela mehsoos kar raha hoon"],
  ["कुछ समझ नहीं आ रहा", "kuch samajh nahi aa raha"],
  ["मैं समझना चाहता हूँ", "main samajhna chahta hoon"],
  ["आज का दिन बहुत खराब था", "aaj ka din bahut kharab tha"],
  ["सब ठीक है", "sab theek hai"],
  ["मेरी ज़िंदगी में बहुत उलझन है", "meri zindagi mein bahut uljhan hai"],
  ["कल मेरी मीटिंग है", "kal meri meeting hai"],
  ["ऑफिस में टेंशन है", "office mein tension hai"],
  ["मुझे बात करनी है", "mujhe baat karni hai"],
  ["वो मेरी बात नहीं सुनता", "wo meri baat nahi sunta"],
  ["मैं थक गया हूँ", "main thak gaya hoon"],
  ["मुझे रोना आ रहा है", "mujhe rona aa raha hai"],
  ["मैं अपने आप को समय देना चाहती हूँ", "main apne aap ko samay dena chahti hoon"],
  ["मुझे लगता है मैं ठीक नहीं हूँ", "mujhe lagta hai main theek nahi hoon"],
  ["दर्द बहुत है", "dard bahut hai"],
  ["मेरे लिए यह मुश्किल है", "mere liye yeh mushkil hai"],
  ["कोई मेरी मदद करो", "koi meri madad karo"],
  ["क्यों ऐसा होता है", "kyun aisa hota hai"],
  ["मेरा दिमाग शांत नहीं है", "mera dimag shaant nahi hai"],
  ["इंटरव्यू से पहले डर लग रहा है", "interview se pehle dar lag raha hai"],
  ["मैं अच्छा महसूस कर रहा हूँ", "main achha mehsoos kar raha hoon"],
  ["सोचना बंद नहीं होता", "sochna band nahi hota"],
  ["मुझे आराम चाहिए", "mujhe aaram chahiye"],
  ["मुझे कहना है पर बोल नहीं पाता", "mujhe kehna hai par bol nahi pata"],
  ["सब कुछ एक साथ हो रहा है", "sab kuch ek saath ho raha hai"],
  ["मेरा मन नहीं लग रहा", "mera man nahi lag raha"],
  ["मुझे बेचैनी हो रही है", "mujhe bechaini ho rahi hai"],
  ["मैं बहुत दुखी हूँ", "main bahut dukhi hoon"],
  ["नींद आने में परेशानी होती है", "neend aane mein pareshani hoti hai"],
  ["मुझे अपने ऊपर भरोसा नहीं है", "mujhe apne oopar bharosa nahi hai"],
  ["कोई बात नहीं", "koi baat nahi"],
  ["तुम कहाँ हो", "tum kahan ho"],
  ["मैं ठीक हूँ, बस थोड़ा थका हुआ हूँ", "main theek hoon, bas thoda thaka hua hoon"],
];

test("everyday Hindi, in everyday English letters", () => {
  const wrong = PHRASES.map(([hindi, expected]) => [hindi, expected, toHinglish(hindi)]).filter(([, expected, got]) => got !== expected);
  assert.deepEqual(wrong, []);
});

test("English words and punctuation pass through; Hindi numbers become digits", () => {
  assert.equal(toHinglish("मेरी meeting कल है।"), "meri meeting kal hai.");
  assert.equal(toHinglish("२ बजे"), "2 baje");
  assert.equal(toHinglish("I feel fine"), "I feel fine");
});

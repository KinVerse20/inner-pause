// Hindi speech, shown the way people type it: Devanagari from the phone's
// own recognizer ("आप क्या कर रहे हो") turned into everyday English
// letters ("aap kya kar rahe ho"), on the device. No imports, so it's
// tested directly on everyday phrases (tests/hinglish.test.mjs).
//
// The hard part is the silent "a" (schwa): every Hindi consonant carries an
// "a" in writing that's often not said ("कर" is "kar", not "kara";
// "समझना" is "samajhna"). The rule used: drop it at the end of a word, and
// in the middle where a vowel comes before and a vowel after (V C a C V),
// working right to left. Long vowels are doubled only in one syllable
// words ("aap", "baat", "theek"), the way they're usually typed.

const CONSONANTS: Record<string, string> = {
  क: "k", ख: "kh", ग: "g", घ: "gh", ङ: "n",
  च: "ch", छ: "ch", ज: "j", झ: "jh", ञ: "n",
  ट: "t", ठ: "th", ड: "d", ढ: "dh", ण: "n",
  त: "t", थ: "th", द: "d", ध: "dh", न: "n",
  प: "p", फ: "ph", ब: "b", भ: "bh", म: "m",
  य: "y", र: "r", ल: "l", व: "v", श: "sh", ष: "sh", स: "s", ह: "h",
  // Precomposed nukta letters.
  क़: "q", ख़: "kh", ग़: "gh", ज़: "z", ड़: "d", ढ़: "dh", फ़: "f", य़: "y",
};

// The same letters with a combining nukta (़).
const NUKTA: Record<string, string> = { क: "q", ख: "kh", ग: "gh", ज: "z", ड: "d", ढ: "dh", फ: "f", य: "y" };

type Vowel = "a" | "aa" | "i" | "ii" | "u" | "uu" | "ri" | "e" | "ai" | "o" | "au";

const INDEPENDENT: Record<string, Vowel> = {
  अ: "a", आ: "aa", इ: "i", ई: "ii", उ: "u", ऊ: "uu", ऋ: "ri", ए: "e", ऐ: "ai", ओ: "o", औ: "au", ऑ: "o", ऍ: "e",
};

const MATRAS: Record<string, Vowel> = {
  "ा": "aa", "ि": "i", "ी": "ii", "ु": "u", "ू": "uu", "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॉ": "o", "ॅ": "e",
};

const HALANT = "्";
const NASALS = new Set(["ं", "ँ"]);
const VISARGA = "ः";
const DIGITS = "०१२३४५६७८९";

// Everyday words whose usual spelling the rules don't reach, and English
// words the recognizer writes in Devanagari ("मीटिंग" is "meeting").
const WORDS: Record<string, string> = {
  नहीं: "nahi", नही: "nahi", क्यों: "kyun", क्यूँ: "kyun", क्यूं: "kyun", वो: "wo", वह: "woh", यह: "yeh", ये: "ye",
  माँ: "maa", मां: "maa", हाँ: "haan", हां: "haan", जी: "ji", अच्छा: "achha", अच्छी: "achhi", अच्छे: "achhe",
  मीटिंग: "meeting", ऑफिस: "office", ऑफ़िस: "office", टेंशन: "tension", फोन: "phone", फ़ोन: "phone", कॉल: "call",
  बॉस: "boss", एग्जाम: "exam", एग्ज़ाम: "exam", इंटरव्यू: "interview", प्रॉब्लम: "problem", सॉरी: "sorry",
  प्लीज: "please", प्लीज़: "please", ओके: "okay", कॉलेज: "college", स्कूल: "school", जॉब: "job", फैमिली: "family",
  फ्रेंड: "friend", फ्रेंड्स: "friends", प्रेजेंटेशन: "presentation", प्रेज़ेंटेशन: "presentation", डेडलाइन: "deadline",
  स्ट्रेस: "stress", एंग्जायटी: "anxiety", डिप्रेशन: "depression", मैसेज: "message", वर्क: "work", हेल्प: "help",
  लाइफ: "life", टाइम: "time", प्रोजेक्ट: "project", क्लाइंट: "client", टीम: "team", बोर: "bore", फील: "feel",
  थैंक्स: "thanks", थैंक: "thank", कंपनी: "company", मैनेजर: "manager", रिलेशनशिप: "relationship", ब्रेकअप: "breakup",
  नर्वस: "nervous", कॉन्फिडेंस: "confidence", फोकस: "focus", ओवरथिंकिंग: "overthinking", पैनिक: "panic",
};

interface Unit {
  /** The Devanagari letter it came from. */
  src: string;
  /** The consonant's letters, or "" for a vowel on its own. */
  c: string;
  /** The vowel it carries; null when it has none (halant, or a dropped schwa). */
  v: Vowel | null;
  /** The written "a" every consonant carries until a matra or halant replaces it. */
  schwa: boolean;
  nasal: boolean;
  visarga: boolean;
}

function parse(word: string): Unit[] {
  const units: Unit[] = [];
  for (const char of word) {
    const last = units[units.length - 1];
    if (char === "़" && last?.c) {
      if (NUKTA[last.src]) last.c = NUKTA[last.src];
    } else if (CONSONANTS[char]) units.push({ src: char, c: CONSONANTS[char], v: "a", schwa: true, nasal: false, visarga: false });
    else if (INDEPENDENT[char]) units.push({ src: char, c: "", v: INDEPENDENT[char], schwa: false, nasal: false, visarga: false });
    else if (MATRAS[char] && last?.c) {
      last.v = MATRAS[char];
      last.schwa = false;
    } else if (char === HALANT && last) {
      last.v = null;
      last.schwa = false;
    } else if (NASALS.has(char) && last) last.nasal = true;
    else if (char === VISARGA && last) last.visarga = true;
  }
  return units;
}

const hasVowel = (unit: Unit | undefined) => Boolean(unit && unit.v);

function dropSchwas(units: Unit[]) {
  const last = units[units.length - 1];
  // At the end of a word, unless the word is one letter ("न") or ends in a
  // cluster with r, y or v ("mitra", "satya").
  if (units.length > 1 && last.schwa && !last.nasal) {
    const cluster = units[units.length - 2].v === null;
    if (!(cluster && ["r", "y", "v"].includes(last.c))) last.v = null;
  }
  // In the middle: a vowel before (with nothing closing its syllable) and a
  // vowel after. Right to left, so each choice sees the ones after it.
  for (let index = units.length - 2; index >= 1; index--) {
    const unit = units[index];
    if (!unit.schwa || unit.v !== "a" || unit.nasal) continue;
    const before = units[index - 1];
    const after = units[index + 1];
    if (hasVowel(before) && !before.nasal && !before.visarga && after.c && hasVowel(after)) unit.v = null;
  }
}

function spell(units: Unit[]): string {
  const syllables = units.filter(hasVowel).length;
  let out = "";
  units.forEach((unit, index) => {
    const final = index === units.length - 1;
    const previous = units[index - 1];
    let vowel = "";
    switch (unit.v) {
      case null:
        break;
      case "aa":
        // Doubled at the start of a word ("aaj") or in one syllable words ("baat").
        vowel = (unit.c === "" && index === 0) || (syllables === 1 && !final) ? "aa" : "a";
        break;
      case "ii":
        // Doubled inside a word ("theek", "neeche"), single at its end ("ji", "zindagi").
        vowel = final ? "i" : "ee";
        break;
      case "uu":
        // "mehsoos", "toot", "hoon"; but "tu".
        vowel = final && !unit.nasal ? "u" : "oo";
        break;
      case "a": {
        // Before an ह that runs into the next letter, the "a" is said "e": "mehsoos", "pehle", "kehna".
        const next = units[index + 1];
        vowel = next && next.c === "h" && next.v === null && index + 1 < units.length - 1 ? "e" : "a";
        break;
      }
      case "e":
        // "में" is "mein", "करें" is "karein".
        vowel = final && unit.nasal ? "ei" : "e";
        break;
      default:
        vowel = unit.v;
    }
    // "लिए" is "liye", "चाहिए" is "chahiye".
    if (unit.c === "" && unit.v === "e" && previous && (previous.v === "i" || previous.v === "ii")) vowel = "ye";
    let nasal = "";
    if (unit.nasal) {
      const next = units[index + 1];
      nasal = next && ["p", "ph", "b", "bh", "m"].includes(next.c) ? "m" : "n";
    }
    out += unit.c + vowel + nasal + (unit.visarga ? "h" : "");
  });
  // "च्छ" is said and typed "chh": "achha".
  return out.replace(/chch/g, "chh");
}

const DEVANAGARI_WORD = /[ऀ-ॿ]+/g;

function romanizeWord(word: string): string {
  if (WORDS[word]) return WORDS[word];
  const digits = [...word].every((char) => DIGITS.includes(char));
  if (digits) return [...word].map((char) => String(DIGITS.indexOf(char))).join("");
  const units = parse(word);
  if (units.length === 0) return word === "।" || word === "॥" ? "." : "";
  dropSchwas(units);
  return spell(units);
}

/** Devanagari in `text` written in everyday English letters; anything else is left as it is. */
export function toHinglish(text: string): string {
  return text.replace(DEVANAGARI_WORD, (word) => {
    // Sentence marks travel with a word: split them off.
    const marks = word.match(/[।॥]+$/)?.[0] ?? "";
    const body = marks ? word.slice(0, -marks.length) : word;
    return (body ? romanizeWord(body) : "") + (marks ? "." : "");
  });
}

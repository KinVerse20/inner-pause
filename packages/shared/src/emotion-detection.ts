import { CATALOG_VERSION, emotionCatalog, MAX_EMOTIONS } from './emotion-catalog.ts';

export interface EmotionSuggestion {
  emotionId: string;
  confidence: 'medium' | 'high';
  evidence: string[];
}

const normalize = (text: string) => text.toLowerCase().replace(/[’‘]/g, "'")
  .replace(/\b(can't|cannot)\b/g, 'can not').replace(/\bwon't\b/g, 'will not')
  .replace(/n't\b/g, ' not').replace(/[-–]/g, ' ').replace(/\s+/g, ' ').trim();
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function detectEmotions(input: string) {
  if (typeof input !== 'string' || input.trim().length === 0 || input.length > 10000) {
    throw new Error('Enter a reflection between 1 and 10,000 characters.');
  }
  const suggestions: EmotionSuggestion[] = [];
  // Clause boundaries stop a negation from leaking across "but" or a new sentence.
  const clauses = normalize(input).split(/[.!?;\n]+|\b(?:but|however|yet)\b/);
  for (const emotion of emotionCatalog) {
    const evidence = new Set<string>();
    let firstPerson = false;
    for (const clause of clauses) {
      for (const rawPhrase of emotion.phrases) {
        const phrase = normalize(rawPhrase);
        const matcher = new RegExp(`\\b${escape(phrase)}\\b`, 'g');
        for (const match of clause.matchAll(matcher)) {
          const before = clause.slice(0, match.index);
          const scope = before.split(/\band\s+(?=i\b|i'm\b)|,/).at(-1) ?? before;
          const negated = /\b(?:not|never|no longer|without|hardly)\b(?:\s+\w+){0,6}\s*$/.test(scope)
            && !/\bnot only\b/.test(scope);
          const hypothetical = /\b(?:if|might|maybe|perhaps)\b/.test(before);
          const otherPerson = /\b(?:he|she|they|my friend|my partner|my colleague)\b/.test(before)
            && !/\b(?:i|i'm|i've)\b/.test(before);
          if (negated || hypothetical || otherPerson) continue;
          evidence.add(rawPhrase);
          firstPerson ||= /\b(?:i|i'm|i've)\b/.test(before);
        }
      }
    }
    if (evidence.size) suggestions.push({ emotionId: emotion.id, confidence: firstPerson ? 'high' : 'medium', evidence: [...evidence] });
  }
  suggestions.sort((a, b) => Number(b.confidence === 'high') - Number(a.confidence === 'high') || b.evidence.length - a.evidence.length);
  return { catalogVersion: CATALOG_VERSION, suggestions: suggestions.slice(0, MAX_EMOTIONS), requiresConfirmation: true as const };
}

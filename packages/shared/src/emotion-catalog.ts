export const CATALOG_VERSION = '2026-11-10.1';
export const MAX_EMOTIONS = 7;
export const frequencies = { root: 396, sacral: 417, 'solar-plexus': 528, heart: 639, throat: 741, 'third-eye': 852, crown: 963 } as const;
export type Chakra = keyof typeof frequencies;
export interface EmotionDefinition { id: string; label: string; category: string; chakra: Chakra; phrases: readonly string[] }
// These are product associations in a traditional chakra framework, not diagnoses.
export const emotionCatalog: readonly EmotionDefinition[] = [
  { id: 'anxiety', label: 'Anxiety', category: 'Safety', chakra: 'root', phrases: ['anxiety', 'anxious', 'worried', 'worrying', 'nervous', 'on edge'] },
  { id: 'fear', label: 'Fear', category: 'Safety', chakra: 'root', phrases: ['afraid', 'scared', 'frightened', 'fearful', 'unsafe'] },
  { id: 'insecurity', label: 'Insecurity', category: 'Safety', chakra: 'root', phrases: ['insecure', 'insecurity', 'unsettled', 'unsteady'] },
  { id: 'guilt', label: 'Guilt', category: 'Feeling', chakra: 'sacral', phrases: ['guilty', 'guilt', 'regretful', 'regret what i did'] },
  { id: 'numbness', label: 'Emotional numbness', category: 'Feeling', chakra: 'sacral', phrases: ['numb', 'emotionally numb', 'unable to enjoy', 'cannot feel anything'] },
  { id: 'creative-block', label: 'Creative block', category: 'Feeling', chakra: 'sacral', phrases: ['creatively blocked', 'creative block', 'creativity is stuck'] },
  { id: 'overwhelm', label: 'Overwhelm', category: 'Confidence', chakra: 'solar-plexus', phrases: ['overwhelmed', 'overwhelming', 'too much to handle', 'cannot cope', 'stressed', 'stressed out'] },
  { id: 'self-doubt', label: 'Self-doubt', category: 'Confidence', chakra: 'solar-plexus', phrases: ['self doubt', 'doubt myself', 'not good enough', 'low confidence', 'not confident'] },
  { id: 'shame', label: 'Shame', category: 'Confidence', chakra: 'solar-plexus', phrases: ['ashamed', 'shame', 'worthless', 'humiliated'] },
  { id: 'powerlessness', label: 'Powerlessness', category: 'Confidence', chakra: 'solar-plexus', phrases: ['powerless', 'helpless', 'out of control'] },
  { id: 'sadness', label: 'Sadness', category: 'Connection', chakra: 'heart', phrases: ['sad', 'sadness', 'downhearted', 'unhappy', 'feeling low'] },
  { id: 'grief', label: 'Grief', category: 'Connection', chakra: 'heart', phrases: ['grieving', 'grief', 'bereaved', 'mourning'] },
  { id: 'loneliness', label: 'Loneliness', category: 'Connection', chakra: 'heart', phrases: ['lonely', 'loneliness', 'isolated', 'left out'] },
  { id: 'hurt', label: 'Hurt', category: 'Connection', chakra: 'heart', phrases: ['heartbroken', 'rejected', 'emotionally hurt', 'betrayed'] },
  { id: 'resentment', label: 'Resentment', category: 'Connection', chakra: 'heart', phrases: ['resentful', 'resentment', 'holding a grudge', 'bitter'] },
  { id: 'frustration', label: 'Frustration', category: 'Expression', chakra: 'throat', phrases: ['frustrated', 'frustration', 'annoyed', 'irritated'] },
  { id: 'anger', label: 'Anger', category: 'Expression', chakra: 'throat', phrases: ['angry', 'anger', 'furious', 'enraged'] },
  { id: 'unheard', label: 'Feeling unheard', category: 'Expression', chakra: 'throat', phrases: ['unheard', 'cannot speak up', 'not listened to', 'unable to express', 'silenced'] },
  { id: 'confusion', label: 'Confusion', category: 'Clarity', chakra: 'third-eye', phrases: ['confused', 'confusion', 'uncertain', 'indecisive'] },
  { id: 'overthinking', label: 'Overthinking', category: 'Clarity', chakra: 'third-eye', phrases: ['overthinking', 'racing thoughts', 'mind will not stop', 'thoughts keep looping'] },
  { id: 'disconnection', label: 'Disconnection', category: 'Meaning', chakra: 'crown', phrases: ['disconnected', 'disconnection', 'spiritually alone'] },
  { id: 'lack-of-purpose', label: 'Lack of purpose', category: 'Meaning', chakra: 'crown', phrases: ['no purpose', 'without purpose', 'meaningless', 'lost my sense of purpose'] },
];

export function confirmEmotions(ids: readonly string[]): EmotionDefinition[] {
  if (!Array.isArray(ids) || !ids.length || ids.length > MAX_EMOTIONS || new Set(ids).size !== ids.length) {
    throw new Error(`Select between 1 and ${MAX_EMOTIONS} different emotions.`);
  }
  return ids.map(id => {
    const emotion = emotionCatalog.find(item => item.id === id);
    if (!emotion) throw new Error(`Unknown emotion: ${id}`);
    return emotion;
  });
}

import { emotionCatalog, frequencies, type Chakra } from '../../packages/shared/src/emotion-catalog';

export type MomentCategory = 'coming-up' | 'happening-now' | 'just-happened';
export type PhaseOneSound = 'rain' | 'forest' | 'waves' | 'wind' | 'binaural-focus' | 'bilateral-calm' | 'mindspace' | 'frequency-only';

export const soundOptions: { id: PhaseOneSound; label: string; icon: string; copy: string; headphoneOnly?: boolean }[] = [
  { id: 'rain', label: 'Rain', icon: '☂', copy: 'A steady, familiar wash of rain' },
  { id: 'forest', label: 'Forest', icon: '♧', copy: 'Leaves, birds and a quiet natural space' },
  { id: 'waves', label: 'Ocean waves', icon: '≈', copy: 'Slow water movement and open space' },
  { id: 'wind', label: 'Gentle wind', icon: '∿', copy: 'Soft moving air without musical notes' },
  { id: 'binaural-focus', label: 'Binaural focus', icon: '◐', copy: 'Different tones in each ear; headphones required', headphoneOnly: true },
  { id: 'bilateral-calm', label: 'Bilateral calm', icon: '◑', copy: 'A gentle stereo pattern; headphones required', headphoneOnly: true },
  { id: 'mindspace', label: 'Mindspace', icon: '↔', copy: 'A calm ambient sound that moves gently between your ears', headphoneOnly: true },
  { id: 'frequency-only', label: 'Frequency only', icon: '◉', copy: 'The selected undertone without ambience' },
];

export const toneLevelDb = { soft: -48, balanced: -45, clear: -39 } as const;

export const chakraDetails: Record<Chakra, {
  name: string;
  shortName: string;
  theme: string;
  color: string;
  represents: string;
  unsettled: string;
  support: string;
}> = {
  root: {
    name: 'Root chakra', shortName: 'Root', theme: 'Safety · Stability · Grounding', color: '#c45b5b',
    represents: 'Your sense of safety, stability and being supported.',
    unsettled: 'Life may feel uncertain, rushed or difficult to hold.',
    support: 'A steady 396 Hz undertone is layered beneath your chosen sound experience.',
  },
  sacral: {
    name: 'Sacral chakra', shortName: 'Sacral', theme: 'Emotion · Creativity · Flow', color: '#d7823d',
    represents: 'Your relationship with emotion, pleasure, creativity and change.',
    unsettled: 'Feelings may seem stuck, muted or difficult to move through.',
    support: 'A steady 417 Hz undertone is layered beneath your chosen sound experience.',
  },
  'solar-plexus': {
    name: 'Solar plexus chakra', shortName: 'Solar plexus', theme: 'Confidence · Strength · Choice', color: '#d4a128',
    represents: 'Your confidence, personal strength and ability to make choices.',
    unsettled: 'You may doubt yourself, feel powerless or struggle to cope.',
    support: 'A steady 528 Hz undertone is layered beneath your chosen sound experience.',
  },
  heart: {
    name: 'Heart chakra', shortName: 'Heart', theme: 'Love · Connection · Compassion', color: '#4eaa75',
    represents: 'Your experience of love, belonging, grief and connection.',
    unsettled: 'You may feel lonely, hurt, guarded or weighed down by loss.',
    support: 'A steady 639 Hz undertone is layered beneath your chosen sound experience.',
  },
  throat: {
    name: 'Throat chakra', shortName: 'Throat', theme: 'Expression · Honesty · Voice', color: '#4499c7',
    represents: 'Your ability to express yourself clearly and feel heard.',
    unsettled: 'Words may feel blocked, unheard or charged with frustration.',
    support: 'A steady 741 Hz undertone is layered beneath your chosen sound experience.',
  },
  'third-eye': {
    name: 'Third eye chakra', shortName: 'Third eye', theme: 'Intuition · Clarity · Perspective', color: '#6665bd',
    represents: 'Your sense of clarity, perspective and inner knowing.',
    unsettled: 'Thoughts may loop, decisions may feel difficult and the mind may feel crowded.',
    support: 'A steady 852 Hz undertone is layered beneath your chosen sound experience.',
  },
  crown: {
    name: 'Crown chakra', shortName: 'Crown', theme: 'Meaning · Connection · Awareness', color: '#8d64bd',
    represents: 'Your connection with meaning, perspective and something larger than the immediate moment.',
    unsettled: 'You may feel disconnected, directionless or distant from yourself.',
    support: 'A steady 963 Hz undertone is layered beneath your chosen sound experience.',
  },
};

export const chakraOrder = Object.keys(frequencies) as Chakra[];

export interface MomentDefinition {
  id: string;
  category: MomentCategory;
  title: string;
  subtitle: string;
  icon: string;
  emotionIds: string[];
  sound: PhaseOneSound;
  tonePreset: 'soft' | 'balanced' | 'clear';
  minutes: 5 | 10 | 15;
}

export const momentCategories: Record<MomentCategory, { title: string; subtitle: string; prompt: string; icon: string }> = {
  'coming-up': { title: 'Coming up', subtitle: 'Get ready', prompt: 'What are you preparing for?', icon: '☀' },
  'happening-now': { title: 'Happening now', subtitle: 'Stay with yourself', prompt: 'What is happening right now?', icon: '≈' },
  'just-happened': { title: 'Just happened', subtitle: 'Come back to yourself', prompt: 'What are you coming back from?', icon: '☾' },
};

export const moments: MomentDefinition[] = [
  { id: 'big-event', category: 'coming-up', title: 'A big event', subtitle: 'Feel steady before it begins', icon: '✦', emotionIds: ['anxiety', 'self-doubt'], sound: 'rain', tonePreset: 'balanced', minutes: 5 },
  { id: 'interview', category: 'coming-up', title: 'Interview or presentation', subtitle: 'Enter with clarity and confidence', icon: '▥', emotionIds: ['anxiety', 'self-doubt'], sound: 'forest', tonePreset: 'balanced', minutes: 5 },
  { id: 'difficult-conversation-ahead', category: 'coming-up', title: 'A difficult conversation', subtitle: 'Stay calm and speak clearly', icon: '◌', emotionIds: ['anxiety', 'unheard'], sound: 'rain', tonePreset: 'soft', minutes: 5 },
  { id: 'future-worry', category: 'coming-up', title: 'Anxious about the future', subtitle: 'Return to what you can hold now', icon: '⌁', emotionIds: ['anxiety', 'overthinking'], sound: 'waves', tonePreset: 'balanced', minutes: 5 },
  { id: 'travel-change', category: 'coming-up', title: 'Travel or a new place', subtitle: 'Feel grounded through change', icon: '➤', emotionIds: ['insecurity', 'anxiety'], sound: 'forest', tonePreset: 'soft', minutes: 5 },
  { id: 'exam', category: 'coming-up', title: 'Exam or important test', subtitle: 'Settle pressure and find focus', icon: '✓', emotionIds: ['overwhelm', 'self-doubt'], sound: 'rain', tonePreset: 'balanced', minutes: 5 },
  { id: 'first-day', category: 'coming-up', title: 'A first day', subtitle: 'Meet something new with steadiness', icon: '◇', emotionIds: ['anxiety', 'insecurity'], sound: 'forest', tonePreset: 'soft', minutes: 5 },
  { id: 'appointment', category: 'coming-up', title: 'An important appointment', subtitle: 'Make room around uncertainty', icon: '＋', emotionIds: ['fear', 'anxiety'], sound: 'rain', tonePreset: 'soft', minutes: 5 },
  { id: 'performance', category: 'coming-up', title: 'A performance', subtitle: 'Feel capable and present', icon: '♪', emotionIds: ['anxiety', 'self-doubt'], sound: 'waves', tonePreset: 'balanced', minutes: 5 },
  { id: 'meeting-people', category: 'coming-up', title: 'Meeting new people', subtitle: 'Arrive open and grounded', icon: '◎', emotionIds: ['anxiety', 'loneliness'], sound: 'forest', tonePreset: 'soft', minutes: 5 },
  { id: 'big-decision', category: 'coming-up', title: 'A big decision', subtitle: 'Create space for clarity', icon: '⌘', emotionIds: ['confusion', 'overthinking'], sound: 'wind', tonePreset: 'soft', minutes: 5 },
  { id: 'sleep-before-event', category: 'coming-up', title: 'Sleep before an important day', subtitle: 'Let tomorrow wait until tomorrow', icon: '☾', emotionIds: ['overthinking', 'anxiety'], sound: 'rain', tonePreset: 'soft', minutes: 10 },

  { id: 'panic-wave', category: 'happening-now', title: 'Everything feels too much', subtitle: 'Slow the moment down', icon: '≈', emotionIds: ['anxiety', 'fear', 'overwhelm'], sound: 'rain', tonePreset: 'soft', minutes: 5 },
  { id: 'argument-now', category: 'happening-now', title: 'In the middle of an argument', subtitle: 'Pause before the next response', icon: '⚡', emotionIds: ['anger', 'hurt', 'unheard'], sound: 'waves', tonePreset: 'balanced', minutes: 5 },
  { id: 'work-overwhelm', category: 'happening-now', title: 'Overwhelmed at work', subtitle: 'Find the next manageable step', icon: '▦', emotionIds: ['overwhelm', 'powerlessness'], sound: 'forest', tonePreset: 'balanced', minutes: 5 },
  { id: 'racing-mind', category: 'happening-now', title: 'My mind will not stop', subtitle: 'Give your thoughts more room', icon: '⌁', emotionIds: ['overthinking', 'anxiety'], sound: 'rain', tonePreset: 'soft', minutes: 5 },
  { id: 'cannot-focus', category: 'happening-now', title: 'Unable to focus', subtitle: 'Return to one clear point', icon: '⊙', emotionIds: ['confusion', 'overwhelm'], sound: 'wind', tonePreset: 'balanced', minutes: 5 },
  { id: 'lonely-now', category: 'happening-now', title: 'Feeling alone', subtitle: 'Stay gently connected to yourself', icon: '○', emotionIds: ['loneliness', 'sadness'], sound: 'forest', tonePreset: 'soft', minutes: 10 },
  { id: 'rejected-now', category: 'happening-now', title: 'Feeling rejected', subtitle: 'Make space around the hurt', icon: '♡', emotionIds: ['hurt', 'sadness'], sound: 'waves', tonePreset: 'soft', minutes: 5 },
  { id: 'confidence-now', category: 'happening-now', title: 'Confidence has dropped', subtitle: 'Reconnect with your strength', icon: '◆', emotionIds: ['self-doubt', 'shame'], sound: 'forest', tonePreset: 'balanced', minutes: 5 },
  { id: 'anger-now', category: 'happening-now', title: 'Anger is rising', subtitle: 'Let intensity move without acting on it', icon: '△', emotionIds: ['frustration', 'anger'], sound: 'waves', tonePreset: 'balanced', minutes: 5 },
  { id: 'unsettled-now', category: 'happening-now', title: 'Feeling unsettled', subtitle: 'Come back to steadiness', icon: '▱', emotionIds: ['fear', 'insecurity'], sound: 'rain', tonePreset: 'soft', minutes: 5 },
  { id: 'grief-now', category: 'happening-now', title: 'A wave of grief', subtitle: 'Let the feeling be held', icon: '❋', emotionIds: ['grief', 'sadness'], sound: 'rain', tonePreset: 'soft', minutes: 10 },
  { id: 'cannot-speak', category: 'happening-now', title: 'Unable to speak up', subtitle: 'Find your voice without forcing it', icon: '◍', emotionIds: ['unheard', 'powerlessness'], sound: 'wind', tonePreset: 'soft', minutes: 5 },

  { id: 'fight-ended', category: 'just-happened', title: 'Just had a fight', subtitle: 'Come down before deciding what comes next', icon: '⚡', emotionIds: ['anger', 'hurt'], sound: 'waves', tonePreset: 'balanced', minutes: 5 },
  { id: 'made-mistake', category: 'just-happened', title: 'Made a mistake', subtitle: 'Separate the moment from your worth', icon: '↺', emotionIds: ['guilt', 'shame'], sound: 'rain', tonePreset: 'soft', minutes: 5 },
  { id: 'bad-news', category: 'just-happened', title: 'Received difficult news', subtitle: 'Create room for what you are feeling', icon: '◇', emotionIds: ['sadness', 'fear'], sound: 'rain', tonePreset: 'soft', minutes: 10 },
  { id: 'rejection-after', category: 'just-happened', title: 'Experienced rejection', subtitle: 'Return to yourself with care', icon: '♡', emotionIds: ['hurt', 'self-doubt'], sound: 'waves', tonePreset: 'soft', minutes: 5 },
  { id: 'embarrassed', category: 'just-happened', title: 'Feel embarrassed', subtitle: 'Let the moment become smaller', icon: '◌', emotionIds: ['shame', 'self-doubt'], sound: 'wind', tonePreset: 'soft', minutes: 5 },
  { id: 'loss', category: 'just-happened', title: 'Experienced a loss', subtitle: 'Be with grief without rushing it', icon: '❋', emotionIds: ['grief', 'loneliness'], sound: 'rain', tonePreset: 'soft', minutes: 10 },
  { id: 'failed-task', category: 'just-happened', title: 'Something did not work out', subtitle: 'Recover your sense of capability', icon: '↗', emotionIds: ['self-doubt', 'sadness'], sound: 'forest', tonePreset: 'balanced', minutes: 5 },
  { id: 'conversation-after', category: 'just-happened', title: 'A conversation went badly', subtitle: 'Release what stayed unsaid', icon: '◌', emotionIds: ['unheard', 'frustration'], sound: 'wind', tonePreset: 'balanced', minutes: 5 },
  { id: 'betrayal', category: 'just-happened', title: 'Trust was broken', subtitle: 'Hold the hurt without carrying it alone', icon: '⊘', emotionIds: ['hurt', 'resentment'], sound: 'waves', tonePreset: 'soft', minutes: 10 },
  { id: 'long-day', category: 'just-happened', title: 'A very heavy day', subtitle: 'Let your system come down gradually', icon: '☁', emotionIds: ['overwhelm', 'numbness'], sound: 'rain', tonePreset: 'soft', minutes: 10 },
  { id: 'ending-change', category: 'just-happened', title: 'Something important ended', subtitle: 'Find yourself inside the change', icon: '⇢', emotionIds: ['disconnection', 'sadness'], sound: 'forest', tonePreset: 'soft', minutes: 10 },
  { id: 'bad-sleep', category: 'just-happened', title: 'Could not sleep', subtitle: 'Begin again without fighting the night', icon: '☾', emotionIds: ['overthinking', 'numbness'], sound: 'rain', tonePreset: 'soft', minutes: 5 },
];

export const quickPauses = [
  { id: 'sleep', label: 'Sleep', copy: 'Rest deeply', icon: '☾', emotionIds: ['overthinking', 'anxiety'], sound: 'rain' as PhaseOneSound, minutes: 10 as const },
  { id: 'reset', label: 'Reset', copy: 'Start fresh', icon: '↻', emotionIds: ['overwhelm', 'numbness'], sound: 'waves' as PhaseOneSound, minutes: 5 as const },
  { id: 'focus', label: 'Focus', copy: 'Find your flow', icon: '⊙', emotionIds: ['confusion', 'overthinking'], sound: 'wind' as PhaseOneSound, minutes: 5 as const },
  { id: 'confidence', label: 'Confidence', copy: 'Feel more capable', icon: '◇', emotionIds: ['self-doubt', 'powerlessness'], sound: 'forest' as PhaseOneSound, minutes: 5 as const },
  { id: 'calm', label: 'Calm', copy: 'Feel more at ease', icon: '≈', emotionIds: ['anxiety', 'overwhelm'], sound: 'rain' as PhaseOneSound, minutes: 5 as const },
  { id: 'release', label: 'Release', copy: 'Let it go', icon: '◒', emotionIds: ['hurt', 'resentment'], sound: 'waves' as PhaseOneSound, minutes: 5 as const },
];

export function emotionsFor(ids: readonly string[]) {
  return ids.map(id => emotionCatalog.find(item => item.id === id)).filter((item): item is (typeof emotionCatalog)[number] => Boolean(item));
}

export function uniqueChakras(ids: readonly string[]) {
  return [...new Set(emotionsFor(ids).map(item => item.chakra))] as Chakra[];
}

export function reasonForChakra(chakra: Chakra, emotionIds: readonly string[]) {
  const labels = emotionsFor(emotionIds).filter(item => item.chakra === chakra).map(item => item.label);
  return `${chakraDetails[chakra].name} is associated here with ${labels.join(' and ').toLowerCase()}. ${chakraDetails[chakra].unsettled}`;
}


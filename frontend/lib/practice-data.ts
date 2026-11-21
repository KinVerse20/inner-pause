import type { TonePreset } from '../../packages/shared/src/session-planning';
import type { PhaseOneSound } from './phase-one-data';

export type PracticeIssueId = 'anxiety' | 'confidence' | 'focus' | 'reactivity' | 'sleep';

export interface PracticeDay {
  day: number;
  title: string;
  intention: string;
  checkInPrompt: string;
  exercise: string;
  action: string;
  reflection: string;
  emotionIds: string[];
  sound: PhaseOneSound;
  preset: TonePreset;
  minutes: 5 | 10;
}

export interface PracticeIssue {
  id: PracticeIssueId;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  frequencyHz: number;
  chakra: string;
  days: PracticeDay[];
}

type DaySeed = Omit<PracticeDay, 'day' | 'checkInPrompt' | 'emotionIds' | 'sound' | 'preset' | 'minutes'> & {
  checkInPrompt?: string;
  emotionIds?: string[];
  sound?: PhaseOneSound;
  preset?: TonePreset;
  minutes?: 5 | 10;
};

function days(prompt: string, defaults: Pick<PracticeDay, 'emotionIds' | 'sound' | 'preset' | 'minutes'>, seeds: DaySeed[]): PracticeDay[] {
  return seeds.map((seed, index) => ({
    day: index + 1,
    checkInPrompt: index === 0 ? prompt : seed.checkInPrompt ?? prompt,
    emotionIds: seed.emotionIds ?? defaults.emotionIds,
    sound: seed.sound ?? defaults.sound,
    preset: seed.preset ?? defaults.preset,
    minutes: seed.minutes ?? defaults.minutes,
    ...seed,
  }));
}

export const practiceIssues: PracticeIssue[] = [
  {
    id: 'confidence', title: 'Low confidence', subtitle: 'Trust yourself and take small courageous actions',
    description: 'Build confidence through self-awareness, kinder self-talk and one achievable real-world action each day.',
    icon: '◇', color: '#d99a21', frequencyHz: 528, chakra: 'Solar plexus',
    days: days('How did self-doubt affect you yesterday?', { emotionIds: ['self-doubt'], sound: 'forest', preset: 'soft', minutes: 5 }, [
      { title: 'Notice the doubt', intention: 'Recognise self-doubt without treating it as a fact.', exercise: 'Name one situation where you held back and the thought that appeared.', action: 'Pause and label one doubtful thought: “This is doubt, not certainty.”', reflection: 'What did the doubtful voice try to protect you from?' },
      { title: 'Remember your strengths', intention: 'Reconnect with evidence of your capability.', exercise: 'Write three strengths and one real example of each.', action: 'Use one strength deliberately today.', reflection: 'Which strength felt easiest to believe?' },
      { title: 'Confidence in the body', intention: 'Practise a calmer, steadier physical presence.', exercise: 'Take five slow breaths while sitting upright with relaxed shoulders.', action: 'Enter one room with a slower pace and open posture.', reflection: 'What changed when your body looked more settled?' },
      { title: 'A fairer inner voice', intention: 'Replace harsh self-talk with language you would use for a friend.', exercise: 'Rewrite one critical thought as a balanced statement.', action: 'Repeat the fairer statement before one difficult task.', reflection: 'Did fair language make action easier?' },
      { title: 'Keep one promise', intention: 'Build self-trust through a small completed commitment.', exercise: 'Choose one useful task that takes less than ten minutes.', action: 'Complete it at the time you chose.', reflection: 'How did keeping the promise affect your trust in yourself?', preset: 'balanced' },
      { title: 'Express one opinion', intention: 'Let your view take up a little space.', exercise: 'Prepare one sentence beginning with “I think…” or “I prefer…”.', action: 'Share that view once without immediately withdrawing it.', reflection: 'What happened after you spoke?', preset: 'balanced', emotionIds: ['unheard'], sound: 'binaural-focus' },
      { title: 'See the first week', intention: 'Notice progress that self-doubt may overlook.', exercise: 'Review the previous six actions and circle the hardest one you completed.', action: 'Acknowledge that action without minimising it.', reflection: 'What can you now do that felt harder a week ago?' },
      { title: 'Release approval', intention: 'Practise acting without universal agreement.', exercise: 'Identify one low-risk choice you normally seek reassurance for.', action: 'Make that choice independently.', reflection: 'What did you learn from deciding for yourself?', preset: 'balanced' },
      { title: 'Set a small boundary', intention: 'Treat your time and needs as valuable.', exercise: 'Choose one reasonable limit you need today.', action: 'Say no, ask for time, or state the limit clearly.', reflection: 'How did it feel to protect your limit?', emotionIds: ['powerlessness'] },
      { title: 'Ask clearly', intention: 'Practise believing your needs are worth expressing.', exercise: 'Write one clear request without apology or over-explanation.', action: 'Make the request to the relevant person.', reflection: 'Was the response different from what you feared?', preset: 'balanced', emotionIds: ['unheard'] },
      { title: 'Act before ready', intention: 'Learn that confidence can follow action.', exercise: 'Choose a task where waiting for certainty has kept you stuck.', action: 'Take the smallest visible first step.', reflection: 'What became clearer after beginning?', preset: 'clear', sound: 'binaural-focus' },
      { title: 'Recover from a mistake', intention: 'Separate an imperfect result from your identity.', exercise: 'Complete: “I made a mistake, and I am still someone who can…”', action: 'Repair, retry or learn one thing from a recent mistake.', reflection: 'What remains true about you despite the mistake?', preset: 'clear' },
      { title: 'Take the meaningful step', intention: 'Use the confidence you have practised.', exercise: 'Choose one action that feels important and slightly intimidating.', action: 'Complete it, or complete a concrete first part of it.', reflection: 'What did courage look like in practice?', preset: 'clear', sound: 'binaural-focus', minutes: 10 },
      { title: 'Carry confidence forward', intention: 'Turn two weeks of action into a repeatable habit.', exercise: 'List three changes you noticed and one practice you will continue.', action: 'Schedule your next courageous action.', reflection: 'What do you trust yourself to handle now?', preset: 'clear', minutes: 10 },
    ]),
  },
  {
    id: 'anxiety', title: 'Anxiety', subtitle: 'Meet uncertainty with steadiness',
    description: 'Practise settling the body, making room for uncertainty and returning attention to what you can do now.',
    icon: '≈', color: '#cf646c', frequencyHz: 396, chakra: 'Root',
    days: days('How did anxiety show up for you yesterday?', { emotionIds: ['anxiety'], sound: 'rain', preset: 'soft', minutes: 5 }, [
      { title: 'Name what is here', intention: 'Notice anxiety without becoming the whole feeling.', exercise: 'Name the thought, body sensation and situation separately.', action: 'Say: “Anxiety is here, and I am here too.”', reflection: 'Where did anxiety show up first?' },
      { title: 'Lengthen the exhale', intention: 'Give your body a clear cue to slow down.', exercise: 'Breathe in gently for four counts and out for six, six times.', action: 'Use two longer exhales during one tense moment.', reflection: 'What changed in your body?' },
      { title: 'Return to the room', intention: 'Move attention from imagined danger to the present.', exercise: 'Name five things you see, four you feel and three you hear.', action: 'Use the senses once when your thoughts race.', reflection: 'Which sense brought you back fastest?' },
      { title: 'Separate fact from forecast', intention: 'Notice when the mind predicts rather than observes.', exercise: 'Write one fact and one feared prediction about the same situation.', action: 'Respond only to the fact today.', reflection: 'How much of the worry was prediction?' },
      { title: 'Choose the next controllable step', intention: 'Replace helplessness with one useful action.', exercise: 'Divide a worry into “within my control” and “outside my control”.', action: 'Complete one item from the first column.', reflection: 'Did action reduce the sense of being stuck?', preset: 'balanced' },
      { title: 'Allow uncertainty', intention: 'Practise not solving every unknown immediately.', exercise: 'Repeat: “I can take the next step without knowing everything.”', action: 'Leave one low-risk uncertainty unanswered for an hour.', reflection: 'What happened when you did not resolve it?', preset: 'balanced', sound: 'bilateral-calm' },
      { title: 'Review your anchors', intention: 'Identify what reliably helps you settle.', exercise: 'List three people, places or actions that help you feel grounded.', action: 'Use one anchor intentionally today.', reflection: 'Which anchor helped most?' },
      { title: 'Make worry specific', intention: 'Turn a vague fear into something workable.', exercise: 'Complete: “I am worried that…” and “If that happened, I could…”', action: 'Prepare one reasonable response, then stop planning.', reflection: 'Did specificity change the size of the worry?' },
      { title: 'Reduce reassurance', intention: 'Build trust in your ability to tolerate doubt.', exercise: 'Notice one question you repeatedly ask for reassurance.', action: 'Delay asking it for thirty minutes.', reflection: 'What did you learn while waiting?', preset: 'balanced' },
      { title: 'Move with the energy', intention: 'Let anxious energy complete a physical cycle.', exercise: 'Walk, stretch or shake out tension for three minutes.', action: 'Use brief movement before one demanding situation.', reflection: 'Where did your body feel lighter?', sound: 'bilateral-calm' },
      { title: 'Approach gently', intention: 'Take a small step toward something anxiety has narrowed.', exercise: 'Choose an avoided action and reduce it to a five-minute version.', action: 'Complete that small version.', reflection: 'Was anticipation harder than the action?', preset: 'clear' },
      { title: 'Speak to yourself safely', intention: 'Offer steadiness instead of internal pressure.', exercise: 'Write one sentence you needed to hear during a recent anxious moment.', action: 'Use that sentence when worry appears.', reflection: 'Which words felt believable?', preset: 'clear' },
      { title: 'Stay through the wave', intention: 'Experience anxiety changing without immediately escaping.', exercise: 'Observe one mild wave for ninety seconds while breathing normally.', action: 'Remain in one safe, mildly uncomfortable moment a little longer.', reflection: 'How did the wave change over time?', preset: 'clear', sound: 'bilateral-calm', minutes: 10 },
      { title: 'Build your steadiness plan', intention: 'Carry forward what genuinely helped.', exercise: 'Choose your three most effective tools from the last two weeks.', action: 'Save when and where you will use each one.', reflection: 'What can you now do when anxiety arrives?', preset: 'clear', minutes: 10 },
    ]),
  },
  {
    id: 'focus', title: 'Poor focus', subtitle: 'Strengthen attention and finish what matters',
    description: 'Reduce friction, practise single-task attention and build a repeatable way to return after distraction.',
    icon: '◎', color: '#347cc2', frequencyHz: 852, chakra: 'Third eye',
    days: days('How did distraction affect you yesterday?', { emotionIds: ['confusion'], sound: 'wind', preset: 'balanced', minutes: 5 }, [
      { title: 'Notice the distraction', intention: 'See where attention goes before trying to control it.', exercise: 'List the three distractions that appeared most often yesterday.', action: 'Mark each distraction once today without judging it.', reflection: 'Which distraction had the strongest pull?' },
      { title: 'Choose one target', intention: 'Give attention one clear destination.', exercise: 'Write the single outcome that matters most today.', action: 'Work only on that outcome for ten minutes.', reflection: 'Did one clear target reduce friction?', sound: 'binaural-focus' },
      { title: 'Clear the field', intention: 'Make the environment support attention.', exercise: 'Remove three visible or digital distractions from your workspace.', action: 'Keep the cleared space for one focus block.', reflection: 'Which removal helped most?' },
      { title: 'Make starting smaller', intention: 'Reduce the resistance before focused work.', exercise: 'Turn a task into an action that can begin in under two minutes.', action: 'Do that starting action immediately.', reflection: 'What changed once you began?' },
      { title: 'Use a focus block', intention: 'Practise sustained attention without demanding perfection.', exercise: 'Set a fifteen-minute timer and define one task.', action: 'Stay with the task until the timer ends.', reflection: 'How many times did you return?', sound: 'binaural-focus' },
      { title: 'Park stray thoughts', intention: 'Keep useful thoughts without following each one.', exercise: 'Create a “later” note beside your task.', action: 'Write distractions there and return to the task.', reflection: 'Did parking thoughts make returning easier?' },
      { title: 'Review your attention', intention: 'Learn the conditions in which focus works best.', exercise: 'Review when, where and how your strongest focus happened this week.', action: 'Repeat one helpful condition today.', reflection: 'What is your best focus condition?' },
      { title: 'Finish one small loop', intention: 'Build momentum through completion.', exercise: 'Choose an unfinished task that takes under fifteen minutes.', action: 'Finish it before opening another task.', reflection: 'How did completion affect your energy?' },
      { title: 'Protect attention', intention: 'Treat focus time as a real commitment.', exercise: 'Choose one twenty-minute block and communicate that you are unavailable.', action: 'Protect the block from messages and switching.', reflection: 'What tried to interrupt the boundary?', sound: 'binaural-focus' },
      { title: 'Return without criticism', intention: 'Make recovery from distraction faster.', exercise: 'Practise the phrase: “Noticing is returning.”', action: 'Use it each time you catch yourself drifting.', reflection: 'Did kindness shorten the distraction?' },
      { title: 'Work with energy', intention: 'Match demanding tasks to your clearer hours.', exercise: 'Identify when your attention naturally feels strongest.', action: 'Place one meaningful task in that window.', reflection: 'Was the task easier at the right time?', preset: 'clear' },
      { title: 'Increase the interval', intention: 'Extend focused attention gradually.', exercise: 'Prepare one twenty-five-minute single-task block.', action: 'Complete the block with your “later” note nearby.', reflection: 'What helped you stay?', preset: 'clear', sound: 'binaural-focus', minutes: 10 },
      { title: 'Complete the meaningful task', intention: 'Use focus in service of something important.', exercise: 'Choose the next concrete milestone of a meaningful task.', action: 'Work until that milestone is complete.', reflection: 'What did sustained attention make possible?', preset: 'clear', minutes: 10 },
      { title: 'Create your focus ritual', intention: 'Turn the best tools into a repeatable beginning.', exercise: 'Choose a place, duration, sound and first action for future focus blocks.', action: 'Schedule your next three focus blocks.', reflection: 'What is your personal signal that focus is beginning?', preset: 'clear', sound: 'binaural-focus', minutes: 10 },
    ]),
  },
  {
    id: 'reactivity', title: 'Emotional reactivity', subtitle: 'Create space between a trigger and your response',
    description: 'Notice activation earlier, regulate the body and practise responding in ways that reflect your values.',
    icon: '⌁', color: '#8b5ac8', frequencyHz: 639, chakra: 'Heart',
    days: days('How did a strong emotional reaction affect you yesterday?', { emotionIds: ['frustration'], sound: 'waves', preset: 'soft', minutes: 5 }, [
      { title: 'Map the reaction', intention: 'See the sequence before trying to change it.', exercise: 'Name the trigger, body signal, thought and action from one recent reaction.', action: 'Notice the earliest part of that sequence today.', reflection: 'What was the first signal?' },
      { title: 'Pause in the body', intention: 'Use the body to interrupt automatic momentum.', exercise: 'Unclench your jaw, lower your shoulders and take one slow breath.', action: 'Use this three-part pause once before replying.', reflection: 'Did the pause change your next action?', sound: 'bilateral-calm' },
      { title: 'Name the emotion precisely', intention: 'Give a strong feeling a clearer shape.', exercise: 'Choose the closest word: angry, hurt, afraid, ashamed, frustrated or overwhelmed.', action: 'Name the feeling silently before acting.', reflection: 'Was another feeling underneath the first one?' },
      { title: 'Separate feeling from action', intention: 'Allow emotion without giving it every decision.', exercise: 'Complete: “I feel ___, and I can choose to ___.”', action: 'Choose one response that does not intensify the situation.', reflection: 'What choice became available?' },
      { title: 'Use a time boundary', intention: 'Create enough space for intensity to fall.', exercise: 'Prepare a sentence asking for ten minutes before continuing.', action: 'Use the sentence when a conversation becomes heated.', reflection: 'What changed during the break?', preset: 'balanced' },
      { title: 'Hear the unmet need', intention: 'Understand what the reaction is trying to protect.', exercise: 'Ask whether you needed respect, safety, clarity, rest or connection.', action: 'State the need without accusation.', reflection: 'Which need was most important?', emotionIds: ['unheard'], sound: 'bilateral-calm' },
      { title: 'Review without shame', intention: 'Learn from reactions without attacking yourself.', exercise: 'Review one reaction using facts rather than labels about your character.', action: 'Choose one repair or adjustment.', reflection: 'What can you learn without excusing harm?' },
      { title: 'Challenge the instant story', intention: 'Check the meaning your mind assigns to a trigger.', exercise: 'Write your first interpretation and two other possible explanations.', action: 'Ask one clarifying question before assuming.', reflection: 'Did another explanation fit?' },
      { title: 'Lower the volume', intention: 'Practise communicating intensity without becoming intensity.', exercise: 'Say one difficult sentence at half your usual speed.', action: 'Slow your speech in one charged conversation.', reflection: 'How did pace affect the interaction?', preset: 'balanced', emotionIds: ['anger'] },
      { title: 'Repair quickly', intention: 'Strengthen trust by returning after a reactive moment.', exercise: 'Prepare: “I reacted strongly. What I meant to say was…”', action: 'Make one sincere repair where needed.', reflection: 'What became possible after repair?', emotionIds: ['hurt'] },
      { title: 'Hold a boundary calmly', intention: 'Stay firm without escalating.', exercise: 'Write one boundary in a short, neutral sentence.', action: 'Repeat the boundary without adding new arguments.', reflection: 'Could you be clear without becoming harsh?', preset: 'clear' },
      { title: 'Stay with discomfort', intention: 'Increase the space available before reacting.', exercise: 'Observe a mild urge to react for ninety seconds.', action: 'Delay one non-urgent response until your body settles.', reflection: 'How did the urge change?', preset: 'clear', sound: 'bilateral-calm', minutes: 10 },
      { title: 'Choose the response', intention: 'Act from the person you want to be.', exercise: 'Name one value you want your response to express.', action: 'Use that value in one difficult interaction.', reflection: 'Did your action match your value?', preset: 'clear' },
      { title: 'Create your response plan', intention: 'Keep the most effective regulation tools ready.', exercise: 'Write your three early warning signs and three reliable pauses.', action: 'Save your plan where you can reach it quickly.', reflection: 'What will you do first when activation rises?', preset: 'clear', sound: 'bilateral-calm', minutes: 10 },
    ]),
  },
  {
    id: 'sleep', title: 'Sleep difficulty', subtitle: 'Help your mind and body prepare for rest',
    description: 'Build a repeatable evening rhythm, reduce mental stimulation and relate more gently to wakeful nights.',
    icon: '☾', color: '#6656c9', frequencyHz: 852, chakra: 'Third eye',
    days: days('How did sleep difficulty affect you last night?', { emotionIds: ['overthinking'], sound: 'rain', preset: 'soft', minutes: 10 }, [
      { title: 'Observe the night', intention: 'Understand your sleep pattern without judging it.', exercise: 'Note bedtime, wake time and the main thing that kept you awake.', action: 'Choose one consistent wake-up time for tomorrow.', reflection: 'What pattern did you notice?' },
      { title: 'Create a closing cue', intention: 'Give the day a clear ending.', exercise: 'Choose a simple cue: dim lights, wash your face or change into sleep clothes.', action: 'Use the same cue thirty minutes before bed.', reflection: 'Did your body notice the transition?' },
      { title: 'Empty the mind', intention: 'Move unfinished thoughts somewhere safe.', exercise: 'Write every task or concern that is circling.', action: 'Add one next step beside each actionable item, then close the list.', reflection: 'What became quieter after writing?' },
      { title: 'Reduce stimulation', intention: 'Protect the nervous system’s descent toward sleep.', exercise: 'Choose one stimulating habit to stop thirty minutes earlier.', action: 'Keep that boundary tonight.', reflection: 'What did you do with the quieter time?' },
      { title: 'Relax in sequence', intention: 'Release tension the mind may not notice.', exercise: 'Soften feet, legs, stomach, shoulders, jaw and eyes in order.', action: 'Repeat the sequence once in bed.', reflection: 'Where were you holding the most tension?', sound: 'bilateral-calm' },
      { title: 'Stop chasing sleep', intention: 'Replace performance pressure with permission to rest.', exercise: 'Repeat: “I do not have to force sleep; I can allow rest.”', action: 'When checking the time feels urgent, return to the phrase.', reflection: 'Did less pressure change the experience?' },
      { title: 'Review the first week', intention: 'Keep the cues that genuinely support rest.', exercise: 'Identify the two evenings that felt calmest and what preceded them.', action: 'Repeat one helpful condition tonight.', reflection: 'What is becoming your strongest sleep cue?' },
      { title: 'Settle the breath', intention: 'Let breathing become slower without controlling it rigidly.', exercise: 'Take six gentle breaths with a slightly longer exhale.', action: 'Use the breaths after turning off the light.', reflection: 'What changed in your body?', sound: 'bilateral-calm' },
      { title: 'Make the room support sleep', intention: 'Reduce environmental friction.', exercise: 'Check light, sound, temperature and visible clutter.', action: 'Improve one condition before bed.', reflection: 'Which environmental change mattered?' },
      { title: 'Respond to wakefulness', intention: 'Use a calm plan instead of frustration.', exercise: 'Choose a quiet, low-light activity for prolonged wakefulness.', action: 'Use it if needed, returning to bed when sleepy.', reflection: 'Did having a plan reduce worry?' },
      { title: 'Release tomorrow', intention: 'Let future responsibilities wait until morning.', exercise: 'Write tomorrow’s first task and the time you will begin it.', action: 'When planning restarts, remind yourself it has been scheduled.', reflection: 'Which thought was hardest to release?' },
      { title: 'Protect the rhythm', intention: 'Strengthen consistency without demanding a perfect night.', exercise: 'Choose a realistic bedtime window rather than an exact minute.', action: 'Enter that window tonight and keep the wake time tomorrow.', reflection: 'How did rhythm affect the night?', preset: 'balanced' },
      { title: 'Build the full ritual', intention: 'Combine the cues that have worked best.', exercise: 'Arrange your best three cues into a twenty-minute sequence.', action: 'Complete the full sequence tonight.', reflection: 'Which part most clearly signalled rest?', sound: 'bilateral-calm' },
      { title: 'Carry rest forward', intention: 'Create a sustainable plan for imperfect nights.', exercise: 'Write your regular routine and your shorter difficult-night version.', action: 'Schedule the routine for the next three evenings.', reflection: 'What can you do consistently without forcing sleep?', preset: 'balanced' },
    ]),
  },
];

export function getPracticeIssue(id: PracticeIssueId) {
  const issue = practiceIssues.find(item => item.id === id);
  if (!issue) throw new Error(`Unknown practice issue: ${id}`);
  return issue;
}

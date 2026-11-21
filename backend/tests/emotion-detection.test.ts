import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectEmotions } from '../../packages/shared/src/emotion-detection.js';
const ids = (text: string) => detectEmotions(text).suggestions.map(s => s.emotionId);
test('detects several explicit feelings with evidence and confirmation', () => {
  assert.deepEqual(ids('I feel anxious and sad. I am frustrated.'), ['anxiety', 'sadness', 'frustration']);
  const result = detectEmotions('I am anxious.');
  assert.equal(result.requiresConfirmation, true);
  assert.deepEqual(result.suggestions[0].evidence, ['anxious']);
});
test('negation, contractions and contrast are respected', () => {
  assert.deepEqual(ids("I am not anxious but I am sad."), ['sadness']);
  assert.deepEqual(ids("I don't feel sad. I am no longer angry."), []);
  assert.deepEqual(ids('I am not sad or anxious.'), []);
  assert.deepEqual(ids('I am not sad and I am anxious.'), ['anxiety']);
  assert.deepEqual(ids('I am not confident and I cannot speak up.'), ['self-doubt', 'unheard']);
});
test('neutral, hypothetical, other-person and substring mentions do not invent emotions', () => {
  for (const input of ['I had lunch.', 'If I am anxious tomorrow', 'My friend is sad.', 'The saddlery is open.']) assert.deepEqual(ids(input), []);
});
test('explicit repetitions are deduplicated and malformed inputs rejected', () => {
  assert.deepEqual(ids('I am sad, sad, sad.'), ['sadness']);
  assert.throws(() => detectEmotions(''));
  assert.throws(() => detectEmotions('x'.repeat(10001)));
});

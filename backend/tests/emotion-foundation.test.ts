import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emotionCatalog, frequencies, confirmEmotions, MAX_EMOTIONS } from '../../packages/shared/src/emotion-catalog.js';

test('catalog offers unique selectable emotions covering all seven chakras', () => {
  assert.equal(new Set(emotionCatalog.map(e => e.id)).size, emotionCatalog.length);
  assert.deepEqual([...new Set(emotionCatalog.map(e => e.chakra))].sort(), Object.keys(frequencies).sort());
  assert.ok(emotionCatalog.every(e => e.phrases.length >= 3));
});
test('selection validates unknown, duplicate, empty and over-limit inputs', () => {
  for (const ids of [[], ['unknown'], ['anxiety', 'anxiety'], emotionCatalog.slice(0, MAX_EMOTIONS + 1).map(e => e.id)]) {
    assert.throws(() => confirmEmotions(ids));
  }
  assert.deepEqual(confirmEmotions(['sadness', 'anxiety']).map(e => e.chakra), ['heart', 'root']);
});

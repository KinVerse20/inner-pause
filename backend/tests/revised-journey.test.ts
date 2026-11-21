import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRepository } from '../src/repositories/in-memory.js';
import { RevisedJourneyService } from '../src/services/revised-journey.js';

test('journey persists confirmed emotions and feedback with user isolation', async () => {
  const repository = new InMemoryRepository();
  const service = new RevisedJourneyService(repository);
  const journey = await service.create('a', { emotionIds: ['sadness', 'fear'], inputMode: 'direct', depth: 'quick', sound: 'rain', tonePreset: 'balanced' });
  assert.equal((await repository.getJourney('a', journey.id)).plan.totalSeconds, 600);
  assert.deepEqual(await repository.listJourneys('b'), []);
  await assert.rejects(repository.getJourney('b', journey.id));
  await assert.rejects(service.finish('b', journey.id, { status: 'completed' }));
  const complete = await service.finish('a', journey.id, { status: 'completed', feedback: { rating: 4, reflection: 'Calmer' } });
  assert.equal(complete.feedback?.rating, 4);
  assert.ok(complete.completedAt);
  assert.deepEqual(await service.finish('a', journey.id, { status: 'completed' }), complete);
});
test('rejects invalid feedback and never fabricates unknown emotions', async () => {
  const service = new RevisedJourneyService(new InMemoryRepository());
  await assert.rejects(service.create('a', { emotionIds: ['invented'] }));
  assert.deepEqual(service.detect({ text: 'I went shopping.' }).suggestions, []);
  await assert.rejects(service.finish('a', 'missing', { status: 'completed', feedback: { rating: 8, reflection: '' } }));
});

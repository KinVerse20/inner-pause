import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PostgresRepository } from '../src/repositories/postgres.js';
import { RevisedJourneyService } from '../src/services/revised-journey.js';
test('PostgreSQL persists journeys between repository instances and isolates owners', { skip: !process.env.REVISED_TEST_DATABASE_URL }, async () => {
  const connectionString = process.env.REVISED_TEST_DATABASE_URL!;
  if (!connectionString.includes('localhost') || !connectionString.includes('innerpause_revised_test_')) throw new Error('Use the isolated local revised test database.');
  const repository = new PostgresRepository({ connectionString });
  const service = new RevisedJourneyService(repository);
  const run = crypto.randomUUID();
  const user = await repository.ensureUser({ providerSubject: run, email: `${run}@example.com` });
  const other = await repository.ensureUser({ providerSubject: run + '-b', email: `${run}-b@example.com` });
  const saved = await service.create(user.id, { emotionIds: ['anxiety'], inputMode: 'direct', depth: 'quick', sound: 'rain', tonePreset: 'soft' });
  await service.finish(user.id, saved.id, { status: 'completed', feedback: { rating: 5, reflection: 'Saved to PostgreSQL' } });
  const second = new PostgresRepository({ connectionString });
  assert.equal((await second.getJourney(user.id, saved.id)).feedback?.rating, 5);
  await assert.rejects(second.getJourney(other.id, saved.id));
  await assert.rejects(second.saveJourney(other.id, saved));
});

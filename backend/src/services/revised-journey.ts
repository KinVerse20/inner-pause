import { CATALOG_VERSION, emotionCatalog, MAX_EMOTIONS } from '../../../packages/shared/src/emotion-catalog.js';
import { detectEmotions } from '../../../packages/shared/src/emotion-detection.js';
import { createSessionPlan, type SessionInput } from '../../../packages/shared/src/session-planning.js';
import type { SavedJourney, JourneyFeedback } from '../../../packages/shared/src/journey.js';
import type { AppRepository } from '../repositories/types.js';
import { validationError } from '../shared/errors.js';

export class RevisedJourneyService {
  constructor(private repository: AppRepository) {}
  catalog() { return { version: CATALOG_VERSION, maxSelection: MAX_EMOTIONS, emotions: emotionCatalog }; }
  detect(input: unknown) {
    try { return detectEmotions((input as { text: string })?.text); }
    catch (error) { throw validationError(error instanceof Error ? error.message : 'Invalid input'); }
  }
  async create(userId: string, input: unknown) {
    let plan;
    try { plan = createSessionPlan(input as SessionInput); }
    catch (error) { throw validationError(error instanceof Error ? error.message : 'Invalid plan'); }
    const journey: SavedJourney = { id: crypto.randomUUID(), plan, status: 'planned', createdAt: new Date().toISOString() };
    await this.repository.saveJourney(userId, journey);
    return journey;
  }
  async finish(userId: string, id: string, input: unknown) {
    const body = input as { status: string; feedback?: JourneyFeedback };
    if (!body || !['completed', 'exited'].includes(body.status)) throw validationError('Invalid journey outcome.');
    if (body.feedback && (!Number.isInteger(body.feedback.rating) || body.feedback.rating < 1 || body.feedback.rating > 5 || typeof body.feedback.reflection !== 'string' || body.feedback.reflection.length > 2000)) throw validationError('Feedback requires a rating from 1 to 5 and a reflection of at most 2,000 characters.');
    const journey = await this.repository.getJourney(userId, id);
    if (journey.status !== 'planned') return journey;
    journey.status = body.status as 'completed' | 'exited';
    journey.completedAt = new Date().toISOString();
    journey.feedback = body.feedback;
    await this.repository.saveJourney(userId, journey);
    return journey;
  }
}

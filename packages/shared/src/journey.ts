import type { SessionPlan } from './session-planning.js';
export interface JourneyFeedback { rating: number; reflection: string }
export interface SavedJourney {
  id: string;
  plan: SessionPlan;
  status: 'planned' | 'completed' | 'exited';
  feedback?: JourneyFeedback;
  createdAt: string;
  completedAt?: string;
}

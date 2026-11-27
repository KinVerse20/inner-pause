// Who operates Inner Pause and how to reach them, plus the Inner Pause Pass
// offer: shown in the app (Pass screen, legal pages, error messages) and
// used by the server (payment amount), so both always agree.

export const APP_NAME = "Inner Pause";
export const OPERATOR_NAME = "Yogesh Yadav";
export const SUPPORT_EMAIL = "yogeshyadavcsk@gmail.com";
export const OPERATOR_COUNTRY = "India";

/** The date the Terms, Privacy Policy and Refund policy last changed. */
export const LEGAL_UPDATED = "27 November 2026";

/**
 * The Inner Pause Pass (docs/COMMERCIAL_PLAN.md): one year of every Pause,
 * paid once a year, nothing renews by itself. PASS_PRICE_INR is what's
 * charged, inclusive of applicable taxes. While the launch offer runs it is
 * below PASS_LIST_PRICE_INR, which the Pass page shows struck out; ending the
 * offer means setting PASS_PRICE_INR to the list price.
 */
export const PASS_LIST_PRICE_INR = 2000;
export const PASS_PRICE_INR = 1000;
export const PASS_DURATION_DAYS = 365;

/** There's no free version: a new account gets this many Pauses to try, then the Pass. */
export const TRIAL_PAUSES = 2;
/** A Pause counts against the trial once it has played this long (or ended, if shorter). */
export const TRIAL_COUNTS_AFTER_SECONDS = 120;

export type PassStatus = "none" | "active" | "expired";

/** The trial: Pauses counted so far (each once), out of TRIAL_PAUSES. */
export interface TrialState {
  used: number;
  limit: number;
  /** The Pauses the trial counted: these can always be finished or played again. */
  pauseIds: string[];
}

/** A signed-in user's Pass, as the server reports it. */
export interface PassState {
  status: PassStatus;
  /** True for an earlier lifetime Pass (never ends; no longer sold). */
  lifetime: boolean;
  /** When the Pass ends or ended; null for lifetime or never bought. */
  expiresAt: string | null;
  trial: TrialState;
}

// Who operates Inner Pause and how to reach them, plus the Inner Pause Pass
// offer: shown in the app (Pass screen, legal pages, error messages) and
// used by the server (payment amount), so both always agree.

export const APP_NAME = "Inner Pause";
export const OPERATOR_NAME = "Yogesh Yadav";
export const SUPPORT_EMAIL = "yogeshyadavcsk@gmail.com";
export const OPERATOR_COUNTRY = "India";

/** The date the Terms, Privacy Policy and Refund policy last changed. */
export const LEGAL_UPDATED = "13 October 2026";

/**
 * One-time price of the Inner Pause Pass, in rupees (inclusive of applicable
 * taxes). Paid once, kept for life: every Pass feature, including the ones
 * added later.
 */
export const PASS_PRICE_INR = 999;

export type PassStatus = "none" | "active" | "expired";

/** A signed-in user's Pass, as the server reports it. */
export interface PassState {
  status: PassStatus;
  /** True for the lifetime Pass (never ends). */
  lifetime: boolean;
  /** When an earlier, time-limited Pass ends or ended; null for lifetime or never bought. */
  expiresAt: string | null;
}

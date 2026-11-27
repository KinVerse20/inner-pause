"use client";

import { PASS_PRICE_INR } from "@inner-pause/shared";

import { getPassExpiresAt, getPassState, getTrial, hasLifetimePass } from "@/lib/entitlements";

// One way of saying where someone stands with the Pass, for the You card,
// the Pass page and the player: the same words everywhere.

const DAY_MS = 24 * 60 * 60 * 1000;
/** From this many days before the end, the Pass reads as ending soon. */
export const ENDING_SOON_DAYS = 7;

export type PassStanding = "lifetime" | "active" | "ending" | "expired" | "trial" | "trial-used";

export interface PassSummary {
  standing: PassStanding;
  /** A short tag: "Active", "Trial". */
  label: string;
  /** One line under the title. */
  line: string;
  /** When the Pass ends or ended; null for lifetime or never bought. */
  endsAt: Date | null;
  trialLeft: number;
  trialLimit: number;
}

export const formatPassDate = (date: Date) => date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export function getPassSummary(now = Date.now()): PassSummary {
  const state = getPassState();
  const expiresAt = getPassExpiresAt();
  const endsAt = expiresAt ? new Date(expiresAt) : null;
  const trial = getTrial();
  const trialLeft = Math.max(0, trial.limit - trial.used);
  const base = { endsAt, trialLeft, trialLimit: trial.limit };
  const price = `${rupees(PASS_PRICE_INR)} a year`;

  if (state === "active" && hasLifetimePass()) return { ...base, standing: "lifetime", label: "For life", line: "Yours for life. Thank you." };
  if (state === "active" && endsAt) {
    const ending = endsAt.getTime() - now <= ENDING_SOON_DAYS * DAY_MS;
    return ending
      ? { ...base, standing: "ending", label: "Ends soon", line: `Ends on ${formatPassDate(endsAt)}. Renew to keep going.` }
      : { ...base, standing: "active", label: "Active", line: `Yours until ${formatPassDate(endsAt)}` };
  }
  if (state === "active") return { ...base, standing: "active", label: "Active", line: "Thank you." };
  if (state === "expired") {
    return { ...base, standing: "expired", label: "Ended", line: endsAt ? `Ended on ${formatPassDate(endsAt)} · renew for ${price}` : `Renew for ${price}` };
  }
  if (trialLeft > 0) {
    return { ...base, standing: "trial", label: "Trial", line: `${trialLeft} of ${trial.limit} trial Pauses left · then ${price}` };
  }
  return { ...base, standing: "trial-used", label: "Trial used", line: `Keep going with the Pass · ${price}` };
}

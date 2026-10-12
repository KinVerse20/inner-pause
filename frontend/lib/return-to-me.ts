import type { BigMomentMode } from "@/lib/big-moment-engine";
import { devNow } from "@/lib/dev-clock";
import { getMomentRecord, listMomentRecords, updateMomentRecord, type MomentRecord, type ReturnToMeState } from "@/lib/moment-storage";

// Return to Me (docs/PRODUCT_FLOW.md §15): deterministic trigger timing,
// maximum one active follow-up, never a repeating nag. Only Before-mode
// Moments with real specific content are eligible — the only example the
// docs give is Before -> later "how did it go?"; During/After are already
// in-the-moment or already-reflected-on, so a later follow-up doesn't fit
// the same "the event hasn't happened yet" premise.
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Not itself locked by docs (deliberately not building "a complex
// scheduling system" per this slice's brief) — a generous, deterministic
// window after which an unanswered follow-up quietly stops being surfaced
// rather than lingering forever. Chosen, not derived.
const EXPIRY_WINDOW_MS = 7 * ONE_DAY_MS;

export function computeInitialReturnToMeState(mode: BigMomentMode, hasMeaningfulContent: boolean): ReturnToMeState {
  if (mode !== "before" || !hasMeaningfulContent) {
    return { status: "not-applicable" };
  }
  // Real wall-clock time for the recorded trigger — only the *comparison*
  // against "now" during eligibility checks goes through the swappable
  // dev clock (lib/dev-clock.ts), never the stamp itself.
  const triggerAt = new Date(Date.now() + ONE_DAY_MS).toISOString();
  return { status: "pending", triggerAt };
}

// Lazily expires anything surfaced too long without a response, then
// returns the single Moment (if any) that should currently be shown —
// "one active follow-up only" (this slice's brief §11).
export function getActiveReturnToMe(): MomentRecord | null {
  const moments = listMomentRecords();
  const now = devNow();

  for (const moment of moments) {
    if (moment.returnToMe.status === "surfaced" && moment.returnToMe.surfacedAt) {
      const surfacedAt = new Date(moment.returnToMe.surfacedAt).getTime();
      if (now - surfacedAt > EXPIRY_WINDOW_MS) {
        updateMomentRecord(moment.id, { returnToMe: { ...moment.returnToMe, status: "expired" } });
        moment.returnToMe = { ...moment.returnToMe, status: "expired" };
      }
    }
  }

  const eligible = moments
    .filter((moment) => {
      const rtm = moment.returnToMe;
      if (rtm.status === "surfaced") return true;
      if (rtm.status === "pending" && rtm.triggerAt) return new Date(rtm.triggerAt).getTime() <= now;
      return false;
    })
    .sort((a, b) => (a.returnToMe.triggerAt ?? "").localeCompare(b.returnToMe.triggerAt ?? ""));

  return eligible[0] ?? null;
}

export function markReturnToMeSurfaced(momentId: string) {
  const moment = getMomentRecord(momentId);
  if (!moment || moment.returnToMe.status !== "pending") return;
  updateMomentRecord(momentId, {
    returnToMe: { ...moment.returnToMe, status: "surfaced", surfacedAt: new Date().toISOString() },
  });
}

export function respondToReturnToMe(momentId: string, responseText: string) {
  const moment = getMomentRecord(momentId);
  if (!moment) return;
  updateMomentRecord(momentId, {
    returnToMe: { ...moment.returnToMe, status: "responded", respondedAt: new Date().toISOString(), responseText },
  });
}

export function dismissReturnToMe(momentId: string) {
  const moment = getMomentRecord(momentId);
  if (!moment) return;
  updateMomentRecord(momentId, {
    returnToMe: { ...moment.returnToMe, status: "dismissed", dismissedAt: new Date().toISOString() },
  });
}

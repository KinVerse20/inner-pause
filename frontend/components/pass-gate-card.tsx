"use client";

import Link from "next/link";
import { PASS_LIST_PRICE_INR, PASS_PRICE_INR, TRIAL_PAUSES } from "@inner-pause/shared";

import { haptic } from "@/lib/haptics";
import { rupees } from "@/lib/pass-summary";
import type { PauseAccess } from "@/lib/trial";

// The light version of the player's trial gate (pause-player-screen.tsx
// TrialGate), for screens outside a Pause: sign in for the trial, or, with
// the trial used, the Pass. One clear way on; the screen around it stays.
export function PassGateCard({
  need,
  redirectTo,
  what,
  onClose,
}: {
  need: Exclude<PauseAccess, "ok">;
  /** Where sign in comes back to. */
  redirectTo: string;
  /** What the person tried to do, for the sign in line: "write in your journal". */
  what: string;
  onClose?: () => void;
}) {
  return (
    <section aria-label={need === "sign-in" ? "Sign in to begin" : "The Inner Pause Pass"} className="ds-card ds-settle px-5 py-5 text-center">
      {need === "sign-in" ? (
        <>
          <h2 className="ds-h3">Your first {TRIAL_PAUSES} Pauses are on us</h2>
          <p className="mt-1.5 text-sm leading-6" style={{ color: "var(--ds-text-secondary)" }}>
            Sign in or create an account to {what}. Everything you save stays with it.
          </p>
          <Link
            href={`/auth?redirectTo=${encodeURIComponent(redirectTo)}`}
            onClick={() => haptic("tap")}
            className="ds-filled ds-tap mt-4 inline-flex justify-center px-8"
          >
            Sign in to begin
          </Link>
        </>
      ) : (
        <>
          <h2 className="ds-h3">Ready to keep going?</h2>
          <p className="mt-1.5 text-sm leading-6" style={{ color: "var(--ds-text-secondary)" }}>
            You&rsquo;ve used your {TRIAL_PAUSES} trial Pauses. The Inner Pause Pass opens everything for a year. What you&rsquo;ve saved stays yours to read.
          </p>
          <p className="mt-3 text-base">
            {PASS_PRICE_INR < PASS_LIST_PRICE_INR ? (
              <s className="mr-2" style={{ color: "var(--ds-text-muted)" }}>
                {rupees(PASS_LIST_PRICE_INR)}
              </s>
            ) : null}
            <span className="font-semibold">{rupees(PASS_PRICE_INR)}</span> a year
          </p>
          <Link href="/profile/pass" onClick={() => haptic("tap")} className="ds-filled ds-tap mt-4 inline-flex justify-center px-8">
            See the Pass
          </Link>
        </>
      )}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="ds-tap mt-2 block min-h-11 w-full text-sm font-medium underline underline-offset-4"
          style={{ color: "var(--ds-text-secondary)" }}
        >
          Not now
        </button>
      ) : null}
    </section>
  );
}

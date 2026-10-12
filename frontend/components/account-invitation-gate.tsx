"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getAccount, subscribeAccount } from "@/lib/account-store";
import { dismissAccountInvitation, hasDismissedAccountInvitation } from "@/lib/account-invitation";
import { listPauseRecords, subscribePauseRecords } from "@/lib/pause-storage";

// The optional post-value account invitation (docs/PRODUCT_FLOW.md §39.B:
// "After first meaningful use, an optional account invitation may
// appear... The user may continue without an account."). A global overlay
// mounted in app/layout.tsx, same pattern as EntryGate/ThemeApplier —
// deliberately NOT built into Home or the Pause Player, which stay exactly
// as locked (docs/PRODUCT_FLOW.md §5's three-section Home, no redesign of
// either screen). "First meaningful use" = at least one Pause has been
// carried through to feedback; shown only once back on Home afterward
// (never mid-Pause, never on arrival), and never again once dismissed or
// once the user is actually signed in.
export function AccountInvitationGate() {
  const pathname = usePathname();
  const router = useRouter();

  // Tri-state, hydration-safe — same reasoning as components/entry-gate.tsx:
  // this must never decide anything from a render-time snapshot that could
  // differ between the server and the client's first paint.
  const [eligible, setEligible] = useState<boolean | null>(null);
  // An immediate, local override for the "Not now"/"Create account" click —
  // dismissAccountInvitation() already persists the permanent choice; this
  // just closes the dialog instantly without waiting on a store round-trip.
  const [closedThisVisit, setClosedThisVisit] = useState(false);

  useEffect(() => {
    const evaluate = () => {
      const hasMeaningfulUse = listPauseRecords().some((record) => Boolean(record.feedback));
      const alreadyHandled = hasDismissedAccountInvitation() || Boolean(getAccount());
      setEligible(hasMeaningfulUse && !alreadyHandled);
    };
    evaluate();
    const unsubPause = subscribePauseRecords(evaluate);
    const unsubAccount = subscribeAccount(evaluate);
    return () => {
      unsubPause();
      unsubAccount();
    };
  }, []);

  const visible = eligible === true && pathname === "/" && !closedThisVisit;
  if (!visible) return null;

  const close = () => setClosedThisVisit(true);

  const handleNotNow = () => {
    dismissAccountInvitation();
    close();
  };

  const handleCreateAccount = () => {
    dismissAccountInvitation();
    close();
    router.push("/profile/account");
  };

  // A non-blocking card, not a modal dialog — this slice's brief §5 is
  // explicit: "must never block core use." No backdrop capturing pointer
  // events; the outer wrapper is pointer-events-none so every tile/nav
  // control underneath stays fully clickable, and only the card itself
  // (pointer-events-auto) is interactive.
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
      aria-live="polite"
    >
      <div
        role="group"
        aria-label="Want to keep your Journey?"
        className="pointer-events-auto w-full max-w-[24rem] space-y-3 rounded-[var(--ds-radius-lg)] px-5 py-4"
        style={{ background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-raised)" }}
      >
        <div>
          <p className="text-[0.95rem] font-semibold">Want to keep your Journey?</p>
          <p className="text-[0.8rem]" style={{ color: "var(--ds-text-secondary)" }}>
            Everything you&rsquo;ve done so far already lives on this device. An account just means it&rsquo;s never
            lost.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCreateAccount}
            className="ds-tap min-h-10 flex-1 rounded-full px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={handleNotNow}
            className="ds-tap min-h-10 flex-1 rounded-full border px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ borderColor: "var(--ds-border)" }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

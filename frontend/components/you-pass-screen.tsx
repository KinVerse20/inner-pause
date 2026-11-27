"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PASS_PRICE_INR } from "@inner-pause/shared";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { IconCheck } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { YouScreenHeader } from "@/components/settings-row";
import { getAccount, subscribeAccount, type LocalAccount } from "@/lib/account-store";
import { activateDevPass, clearPass, getPassState, hasLifetimePass, subscribeEntitlements, type PassState } from "@/lib/entitlements";
import { haptic } from "@/lib/haptics";
import { PaymentCancelledError, buyPass, getPassOffer, type PassOffer } from "@/lib/pass-client";

const PASS_BENEFITS = [
  "Patterns across your whole story, not just recent weeks",
  "Connections between your entries, Pauses and Moments",
  "Growth over time, then and now, side by side",
  "A richer, more personal reading of your Journey",
  "Every feature we add to the Pass, yours too",
];

const FREE_INCLUDES = [
  "Every Pause, Moments and letting it out",
  "All five Practice paths",
  "Your complete journal and Journey",
  "Recent Patterns",
];

const GOLD = "#E0A868";

// You -> Inner Pause Pass (docs/PRODUCT_FLOW.md §36): one payment, kept for
// life, with every Pass feature added later. No subscription, nothing to
// renew. Bought with Razorpay and held on the account (lib/pass-client.ts).
export function YouPassScreen() {
  const [state, setState] = useState<PassState>("free");
  const [lifetime, setLifetime] = useState(false);
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [offer, setOffer] = useState<PassOffer | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const refresh = () => {
      setState(getPassState());
      setLifetime(hasLifetimePass());
      setAccount(getAccount());
    };
    refresh();
    const unsubscribeEntitlements = subscribeEntitlements(refresh);
    const unsubscribeAccount = subscribeAccount(refresh);
    getPassOffer()
      .then(setOffer)
      .catch(() => setOffer(null));
    return () => {
      unsubscribeEntitlements();
      unsubscribeAccount();
    };
  }, []);

  const purchase = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await buyPass();
      haptic("success");
      setMessage({ tone: "success", text: "Thank you. Your Pass is on for the year." });
    } catch (error) {
      if (!(error instanceof PaymentCancelledError)) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Something went wrong. Please try again." });
      }
    } finally {
      setBusy(false);
    }
  };

  const price = offer?.priceInr ?? PASS_PRICE_INR;
  const owned = state === "active" && lifetime;

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <YouScreenHeader title="Inner Pause Pass" />

        <section
          className="relative overflow-hidden rounded-[var(--ds-radius-lg)] px-5 pb-6 pt-7 text-center"
          style={{
            background: `radial-gradient(90% 70% at 50% 0%, color-mix(in srgb, ${GOLD} 30%, transparent) 0%, transparent 70%), var(--ds-surface)`,
            boxShadow: "var(--ds-elevation-1)",
          }}
        >
          <HarmonyFormVisual playing className="ds-only-light mx-auto w-24" />
          <HarmonyFormVisual playing dark className="ds-only-dark mx-auto w-24" />
          {owned ? (
            <>
              <p className="ds-label mt-4 uppercase" style={{ color: `color-mix(in srgb, ${GOLD} 45%, var(--ds-text))` }}>
                Inner Pause Pass
              </p>
              <h2 className="ds-h2 mt-1">Yours for life</h2>
              <p className="mx-auto mt-1 max-w-[17rem] text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                Thank you. Everything below is yours, and so is everything we add to the Pass later.
              </p>
            </>
          ) : (
            <>
              <p className="ds-label mt-4 uppercase" style={{ color: `color-mix(in srgb, ${GOLD} 45%, var(--ds-text))` }}>
                Inner Pause Pass
              </p>
              <p className="mt-1 text-[2rem] font-semibold tracking-[-0.02em]">₹{price}</p>
              <p className="text-[0.95rem] font-medium">once, yours for life</p>
              <p className="mx-auto mt-2 max-w-[17rem] text-[0.85rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                {state === "expired"
                  ? "Your earlier Pass has ended. Nothing was deleted: your whole story is still here."
                  : "One payment. No subscription, nothing to renew. Pay with UPI, card, netbanking or wallet."}
              </p>
            </>
          )}
        </section>

        <section aria-labelledby="pass-includes" className="ds-card px-5 py-4">
          <h2 id="pass-includes" className="ds-h3">
            The Pass adds
          </h2>
          <ul className="mt-3 space-y-2.5">
            {PASS_BENEFITS.map((item) => (
              <li key={item} className="flex gap-3 text-[0.9rem] leading-6">
                <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${GOLD} 25%, var(--ds-surface))`, color: `color-mix(in srgb, ${GOLD} 80%, var(--ds-text))` }} aria-hidden="true">
                  <IconCheck className="h-2.5 w-2.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {!owned ? (
          <section className="space-y-3">
            {account ? (
              <button type="button" onClick={() => void purchase()} disabled={busy || offer?.available === false} className="ds-filled ds-tap w-full disabled:cursor-not-allowed disabled:opacity-55">
                {busy ? "Opening payment…" : offer?.available === false ? "Payments open soon" : `Get the Pass for life · ₹${price}`}
              </button>
            ) : (
              <>
                <Link href="/auth?redirectTo=/profile/pass" className="ds-filled ds-tap flex w-full justify-center">
                  Sign in to get the Pass
                </Link>
                <p className="text-center text-[0.76rem]" style={{ color: "var(--ds-text-muted)" }}>
                  The Pass is kept on your account, so it works on any device you sign in on.
                </p>
              </>
            )}
            <p className="text-center text-[0.75rem]" style={{ color: "var(--ds-text-muted)" }}>
              By buying, you agree to the{" "}
              <Link href="/terms" className="underline underline-offset-2">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/refund-policy" className="underline underline-offset-2">
                Refund policy
              </Link>
              .
            </p>
          </section>
        ) : null}

        {message ? (
          <p role={message.tone === "error" ? "alert" : "status"} className="text-center text-[0.85rem]" style={{ color: message.tone === "error" ? "var(--ds-error)" : "var(--ds-success)" }}>
            {message.text}
          </p>
        ) : null}

        <section aria-labelledby="free-always" className="rounded-[var(--ds-radius-lg)] px-5 py-4" style={{ background: "var(--ds-accent-soft)" }}>
          <h2 id="free-always" className="ds-h3">
            Free, always
          </h2>
          <ul className="mt-2 space-y-1.5">
            {FREE_INCLUDES.map((item) => (
              <li key={item} className="text-[0.88rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {process.env.NODE_ENV === "development" ? (
          <section aria-label="Dev: Pass testing" className="space-y-2 rounded-[var(--ds-radius-sm)] border border-dashed px-3 py-3 text-xs" style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}>
            <p className="font-semibold">DEV · Pass testing (works in development only)</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => activateDevPass()} className="ds-tap min-h-11 rounded-full border px-3 font-medium" style={{ borderColor: "var(--ds-border)" }}>
                Activate Pass
              </button>
              <button type="button" onClick={() => clearPass()} className="ds-tap min-h-11 rounded-full border px-3 font-medium" style={{ borderColor: "var(--ds-border)" }}>
                Reset to free
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </PauseShell>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PASS_DURATION_DAYS, PASS_LIST_PRICE_INR, PASS_PRICE_INR, TRIAL_PAUSES } from "@inner-pause/shared";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { IconCheck } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { YouScreenHeader } from "@/components/settings-row";
import { getAccount, subscribeAccount, type LocalAccount } from "@/lib/account-store";
import { subscribeEntitlements } from "@/lib/entitlements";
import { haptic } from "@/lib/haptics";
import { PaymentCancelledError, buyPass, getPassOffer, type PassOffer } from "@/lib/pass-client";
import { formatPassDate, getPassSummary, rupees, type PassSummary } from "@/lib/pass-summary";

const PASS_INCLUDES = [
  "Every Pause: Right Now, Ground and Moments",
  "All five Practice paths, every day of them",
  "Patterns and Growth across your whole story",
  "Every feature we add to the Pass, yours too",
];

const ALWAYS_YOURS = "Your journal, Highlights and everything you save stay on your account, with the Pass or without it.";

const GOLD = "#E0A868";

// You -> Inner Pause Pass (docs/COMMERCIAL_PLAN.md C1, C3): a year of every
// Pause, paid a year at a time, nothing renews by itself. Shown at the launch
// offer price with the list price struck out. Bought with Razorpay and held
// on the account (lib/pass-client.ts).
export function YouPassScreen() {
  const [summary, setSummary] = useState<PassSummary | null>(null);
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [offer, setOffer] = useState<PassOffer | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const refresh = () => {
      setSummary(getPassSummary());
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

  const price = offer?.priceInr ?? PASS_PRICE_INR;
  const listPrice = offer?.listPriceInr ?? PASS_LIST_PRICE_INR;
  const onOffer = price < listPrice;
  const percentOff = onOffer ? Math.round((1 - price / listPrice) * 100) : 0;
  const standing = summary?.standing ?? "trial";
  const owned = standing === "active" || standing === "lifetime";
  const renewing = standing === "ending" || standing === "expired";

  const purchase = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const pass = await buyPass();
      haptic("success");
      const until = pass.expiresAt ? ` until ${formatPassDate(new Date(pass.expiresAt))}` : "";
      setMessage({ tone: "success", text: `Thank you. Your Pass is on${until}.` });
    } catch (error) {
      if (!(error instanceof PaymentCancelledError)) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Something went wrong. Please try again." });
      }
    } finally {
      setBusy(false);
    }
  };

  const buyLabel = busy
    ? "Opening payment…"
    : offer?.available === false
      ? "Payments open soon"
      : `${renewing ? "Renew for a year" : "Get the Pass"} · ${rupees(price)}`;

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
          <p className="ds-label mt-4 uppercase" style={{ color: `color-mix(in srgb, ${GOLD} 45%, var(--ds-text))` }}>
            Inner Pause Pass
          </p>
          {owned ? (
            <>
              <h2 className="ds-h2 mt-1">{standing === "lifetime" ? "Yours for life" : summary?.endsAt ? `Yours until ${formatPassDate(summary.endsAt)}` : "Yours"}</h2>
              <p className="mx-auto mt-1 max-w-[17rem] text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                Thank you. Every Pause is open to you
                {standing === "active" ? ". We'll email you a week before it ends; nothing renews by itself." : "."}
              </p>
            </>
          ) : (
            <>
              {onOffer ? (
                <p className="mt-3 inline-flex rounded-full px-3 py-1 text-[0.78rem] font-semibold" style={{ background: `color-mix(in srgb, ${GOLD} 24%, var(--ds-surface))`, color: `color-mix(in srgb, ${GOLD} 40%, var(--ds-text))` }}>
                  Launch offer · {percentOff}% off
                </p>
              ) : null}
              <p className="mt-2 flex items-baseline justify-center gap-2.5">
                {onOffer ? (
                  <s className="text-[1.15rem] font-medium" style={{ color: "var(--ds-text-muted)" }} aria-label={`Regular price ${rupees(listPrice)}`}>
                    {rupees(listPrice)}
                  </s>
                ) : null}
                <span className="text-[2.1rem] font-semibold tracking-[-0.02em]">{rupees(price)}</span>
              </p>
              <p className="text-[0.95rem] font-medium">for one year</p>
              <p className="mx-auto mt-2 max-w-[18rem] text-[0.85rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                {standing === "ending" && summary?.endsAt
                  ? `Your Pass ends on ${formatPassDate(summary.endsAt)}. Renewing now adds a year to that date.`
                  : standing === "expired"
                    ? `Your Pass ${summary?.endsAt ? `ended on ${formatPassDate(summary.endsAt)}` : "has ended"}. Nothing was deleted: your whole story is still here.`
                    : standing === "trial"
                      ? `You have ${summary?.trialLeft} of ${TRIAL_PAUSES} trial Pauses left. Each Pause you start uses one, however long you listen.`
                      : `You've used your ${TRIAL_PAUSES} trial Pauses.`}
              </p>
            </>
          )}
        </section>

        <section aria-labelledby="pass-includes" className="ds-card px-5 py-4">
          <h2 id="pass-includes" className="ds-h3">
            For {PASS_DURATION_DAYS === 365 ? "a year" : `${PASS_DURATION_DAYS} days`}, the Pass gives you
          </h2>
          <ul className="mt-3 space-y-2.5">
            {PASS_INCLUDES.map((item) => (
              <li key={item} className="flex gap-3 text-[0.9rem] leading-6">
                <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${GOLD} 25%, var(--ds-surface))`, color: `color-mix(in srgb, ${GOLD} 80%, var(--ds-text))` }} aria-hidden="true">
                  <IconCheck className="h-2.5 w-2.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {!owned || renewing ? (
          <section className="space-y-3">
            {account ? (
              <button type="button" onClick={() => void purchase()} disabled={busy || offer?.available === false} className="ds-filled ds-tap w-full disabled:cursor-not-allowed disabled:opacity-55">
                {buyLabel}
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
            <p className="text-center text-[0.75rem] leading-5" style={{ color: "var(--ds-text-muted)" }}>
              Pay with UPI, card, netbanking or wallet. One payment for the year; it doesn&rsquo;t renew by itself. By buying, you agree to the{" "}
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

        <section aria-labelledby="always-yours" className="rounded-[var(--ds-radius-lg)] px-5 py-4" style={{ background: "var(--ds-accent-soft)" }}>
          <h2 id="always-yours" className="ds-h3">
            Always yours
          </h2>
          <p className="mt-1.5 text-[0.88rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
            {ALWAYS_YOURS}
          </p>
        </section>

      </div>
    </PauseShell>
  );
}

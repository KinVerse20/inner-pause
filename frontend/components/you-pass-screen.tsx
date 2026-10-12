"use client";

import { useEffect, useState } from "react";

import { PauseShell } from "@/components/pause-shell";
import { YouScreenHeader } from "@/components/settings-row";
import {
  activateDevPass,
  clearPass,
  expireDevPassForTesting,
  getPassExpiresAt,
  getPassState,
  subscribeEntitlements,
  type PassState,
} from "@/lib/entitlements";

const PASS_BENEFITS = [
  "Longitudinal pattern analysis across your full history",
  "Deeper cross-entry connections",
  "Growth comparisons over time — \"then vs. now\"",
  "Richer, more personalized Journey interpretation",
];

const FREE_INCLUDES = ["The complete Journal, always", "The complete Highlights history, always", "Basic recent Patterns"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

// You -> Inner Pause Pass (docs/PRODUCT_FLOW.md §36): the functional
// entitlement/state model, not final payment processing. One product, one
// price, 60-day duration, no recurring subscription. Expiry never touches
// history — Journal/Highlights/Patterns/Growth/Practice history all stay
// exactly as they are; only new paid-depth generation is gated.
export function YouPassScreen() {
  const [state, setState] = useState<PassState>("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setState(getPassState());
      setExpiresAt(getPassExpiresAt());
    };
    refresh();
    return subscribeEntitlements(refresh);
  }, []);

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <YouScreenHeader title="Inner Pause Pass" />

        <section className="space-y-2 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
          {state === "active" ? (
            <>
              <p className="text-[0.98rem] font-semibold" style={{ color: "var(--ds-success)" }}>
                Pass active
              </p>
              {expiresAt ? (
                <p className="text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
                  Runs through {formatDate(expiresAt)}.
                </p>
              ) : null}
            </>
          ) : state === "expired" ? (
            <>
              <p className="text-[0.98rem] font-semibold" style={{ color: "var(--ds-warning)" }}>
                Pass expired
              </p>
              <p className="text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
                Nothing was deleted or hidden — your Journal, Highlights, Practice history, and saved Pauses are all
                still here. Only the deeper Journey intelligence below is paused until you renew.
              </p>
            </>
          ) : (
            <>
              <p className="text-[0.98rem] font-semibold">Free</p>
              <p className="text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
                A real, complete product — no arbitrary limits.
              </p>
            </>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-[0.82rem] font-semibold">Free, always</h2>
          <ul className="space-y-1.5 rounded-[var(--ds-radius-md)] px-4 py-3.5" style={{ background: "var(--ds-surface)" }}>
            {FREE_INCLUDES.map((item) => (
              <li key={item} className="text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-[0.82rem] font-semibold">Pass unlocks</h2>
          <ul className="space-y-1.5 rounded-[var(--ds-radius-md)] px-4 py-3.5" style={{ background: "var(--ds-surface)" }}>
            {PASS_BENEFITS.map((item) => (
              <li key={item} className="text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
                {item}
              </li>
            ))}
          </ul>
          <p className="px-1 text-[0.72rem]" style={{ color: "var(--ds-text-muted)" }}>
            One product, one price, 60 days. No recurring subscription.
          </p>
        </section>

        {process.env.NODE_ENV === "development" ? (
          <section
            aria-label="Dev: Pass testing"
            className="space-y-2 rounded-[var(--ds-radius-sm)] border border-dashed px-3 py-3 text-xs"
            style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
          >
            <p className="font-semibold">DEV — Pass testing (stand-in for real payment)</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => activateDevPass()}
                className="ds-tap min-h-9 rounded-full border px-3 font-medium"
                style={{ borderColor: "var(--ds-border)" }}
              >
                Activate Pass
              </button>
              <button
                type="button"
                onClick={() => expireDevPassForTesting()}
                className="ds-tap min-h-9 rounded-full border px-3 font-medium"
                style={{ borderColor: "var(--ds-border)" }}
              >
                Force expired
              </button>
              <button
                type="button"
                onClick={() => clearPass()}
                className="ds-tap min-h-9 rounded-full border px-3 font-medium"
                style={{ borderColor: "var(--ds-border)" }}
              >
                Reset to free
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </PauseShell>
  );
}

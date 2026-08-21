"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { IconChevronRight, IconMic, IconPencil } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { ReturnToMeBanner } from "@/components/return-to-me-banner";
import {
  composeBigMomentPause,
  getSituationOptions,
  type BigMomentMode,
  type SituationOption,
} from "@/lib/big-moment-engine";
import { clearDevNowOffset, getDevNowOffsetMs, setDevNowOffsetMs } from "@/lib/dev-clock";
import { createMomentRecord } from "@/lib/moment-storage";
import { createPauseRecord } from "@/lib/pause-storage";
import { computeInitialReturnToMeState } from "@/lib/return-to-me";

// docs/PRODUCT_FLOW.md §11-14: mode is chosen first — "Coming up" /
// "Happening now" / "Just happened" are the user-facing labels for
// BEFORE/DURING/AFTER, each with its own short purpose line. Internal
// mapping (before/during/after) is never exposed in copy. `atmosphere`
// selects the full-bleed gradient identity below — visual only, sourced
// from BRAND_IDENTITY.md §4.4's tint families, no new product meaning.
const modes: Array<{ id: BigMomentMode; label: string; purpose: string; atmosphere: string }> = [
  { id: "before", label: "Coming up", purpose: "Get ready", atmosphere: "moment-atmosphere--before" },
  { id: "during", label: "Happening now", purpose: "Stay with yourself", atmosphere: "moment-atmosphere--during" },
  { id: "after", label: "Just happened", purpose: "Come back to yourself", atmosphere: "moment-atmosphere--after" },
];

// Orienting headline/subhead shown once a mode is chosen — framing copy
// only. Every control label below it (mode names, purposes, situation
// labels, Write/Speak/Skip/Start Pause) is unchanged from the prior
// implementation, on purpose.
const MODE_HEADLINE: Record<BigMomentMode, string> = {
  before: "What’s coming up?",
  during: "What’s happening?",
  after: "What just happened?",
};
const MODE_SUBHEAD = "Choose a situation, tell us what’s on your mind, or just start.";

export function MomentsScreen() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<BigMomentMode | null>(null);
  const [selectedSituationId, setSelectedSituationId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  // Read after mount, not in a lazy useState initializer — the initializer
  // runs during SSR too (where localStorage doesn't exist), so seeding it
  // from getDevNowOffsetMs() there produces a real client/server mismatch
  // (server always sees 0, client sees whatever's actually stored).
  const [devOffsetMs, setDevOffsetMs] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDevOffsetMs(getDevNowOffsetMs());
  }, []);

  const mode = modes.find((item) => item.id === selectedMode) ?? null;
  const situations: SituationOption[] = mode ? getSituationOptions(mode.id) : [];

  const resetToModeSelect = () => {
    setSelectedMode(null);
    setSelectedSituationId(null);
  };

  // Reuses the existing Core Pause engine end to end (this slice's brief
  // §6) — composeBigMomentPause only overrides mode-specific fields on top
  // of the same PauseDefinition shape, same createPauseRecord store, same
  // /pause/player route. A Moment is created only when there's real
  // specific content (a chosen situation) — never merely from picking a
  // mode (§7, §5): Skip and "Start Pause" with nothing selected behave
  // identically here, on purpose.
  const startPause = (situationId: string | null) => {
    if (!mode || starting) return;
    setStarting(true);
    const definition = composeBigMomentPause(mode.id, { situationId });
    const record = createPauseRecord(definition);

    if (situationId) {
      const situation = situations.find((option) => option.id === situationId);
      const returnToMe = computeInitialReturnToMeState(mode.id, true);
      createMomentRecord({
        mode: mode.id,
        situationId,
        situationLabel: situation?.label ?? null,
        linkedPauseRecordId: record.id,
        returnToMe,
      });
    }

    router.push(`/pause/player?session=${record.id}`);
  };

  const applyDevOffset = (ms: number) => {
    setDevNowOffsetMs(ms);
    setDevOffsetMs(ms);
    window.location.reload();
  };

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        {!mode ? (
          <>
            <header>
              <Link
                href="/"
                aria-label="Back to Home"
                className="ds-tap grid h-11 w-11 place-items-center rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ borderColor: "var(--ds-border)", background: "var(--ds-surface)", color: "var(--ds-text)" }}
              >
                <IconChevronRight className="h-4 w-4" style={{ transform: "scaleX(-1)" }} />
              </Link>
            </header>

            <div>
              <h1 className="text-[1.7rem] font-semibold leading-[1.16] tracking-[-0.01em] sm:text-[2rem]">
                For the big moments in your life
              </h1>
              <p className="mt-2.5 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                We&rsquo;re here for before, during and after what matters.
              </p>
            </div>

            <ReturnToMeBanner />

            <section aria-label="Choose a moment" className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {modes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedMode(item.id)}
                  className={`ds-tap moment-atmosphere ${item.atmosphere} focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2`}
                >
                  <span className="moment-atmosphere-content">
                    <span className="min-w-0">
                      <span className="block text-[1.08rem] font-semibold text-white">{item.label}</span>
                      <span className="mt-1 block text-[0.82rem] text-white/85">{item.purpose}</span>
                    </span>
                    <IconChevronRight className="h-4 w-4 shrink-0 text-white/75" />
                  </span>
                </button>
              ))}
            </section>
          </>
        ) : (
          <>
            <header className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={resetToModeSelect}
                aria-label="Back to Moments"
                className="ds-tap grid h-11 w-11 shrink-0 place-items-center rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ borderColor: "var(--ds-border)", background: "var(--ds-surface)", color: "var(--ds-text)" }}
              >
                <IconChevronRight className="h-4 w-4" style={{ transform: "scaleX(-1)" }} />
              </button>
              <span
                className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{ background: "var(--ds-accent-soft)" }}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--ds-accent)" }} />
                <span
                  className="truncate text-[0.72rem] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: "var(--ds-accent)" }}
                >
                  {mode.label} &middot; {mode.purpose}
                </span>
              </span>
            </header>

            <div>
              <h1 className="text-[1.55rem] font-semibold leading-[1.2] tracking-[-0.01em] sm:text-[1.85rem]">
                {MODE_HEADLINE[mode.id]}
              </h1>
              <p className="mt-2 text-[0.92rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                {MODE_SUBHEAD}
              </p>
            </div>

            <section aria-label="Choose a situation">
              <p
                className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em]"
                style={{ color: "var(--ds-text-muted)" }}
              >
                Choose a situation
              </p>
              <div className="flex flex-wrap gap-2">
                {situations.map((situation) => {
                  const active = selectedSituationId === situation.id;
                  return (
                    <button
                      key={situation.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedSituationId(active ? null : situation.id)}
                      className="ds-tap min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                      style={{
                        borderColor: active ? "var(--ds-accent)" : "var(--ds-border)",
                        background: active ? "var(--ds-accent-soft)" : "transparent",
                        color: active ? "var(--ds-accent)" : "var(--ds-text-secondary)",
                      }}
                    >
                      {situation.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1" style={{ background: "var(--ds-border)" }} />
              <span className="text-xs" style={{ color: "var(--ds-text-muted)" }}>
                or
              </span>
              <span className="h-px flex-1" style={{ background: "var(--ds-border)" }} />
            </div>

            <section
              aria-label="What's on your mind?"
              className="rounded-[var(--ds-radius-md)] px-4 py-4"
              style={{ background: "var(--ds-accent-soft)" }}
            >
              <h2 className="text-[0.98rem] font-semibold">What&rsquo;s on your mind?</h2>
              <p className="mt-1 text-[0.8rem]" style={{ color: "var(--ds-text-secondary)" }}>
                Say it or write it. We&rsquo;ll find the right words.
              </p>
              <div className="mt-3.5 flex gap-2.5">
                <Link
                  href={`/tell?momentMode=${mode.id}`}
                  className="ds-tap flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
                  style={{ border: "1px solid var(--ds-accent)", color: "var(--ds-accent)", background: "var(--ds-surface)" }}
                >
                  <IconPencil className="h-[1.05rem] w-[1.05rem]" />
                  Write
                </Link>
                <Link
                  href={`/tell?momentMode=${mode.id}&mode=speak`}
                  className="ds-tap flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
                  style={{ border: "1px solid var(--ds-accent)", color: "var(--ds-accent)", background: "var(--ds-surface)" }}
                >
                  <IconMic className="h-[1.05rem] w-[1.05rem]" />
                  Speak
                </Link>
              </div>
            </section>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => startPause(null)}
                disabled={starting}
                className="block w-full text-center text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ color: "var(--ds-text-secondary)" }}
              >
                Skip
              </button>
              <button
                type="button"
                disabled={starting}
                onClick={() => startPause(selectedSituationId)}
                className="ds-tap min-h-12 w-full rounded-full text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
              >
                {starting ? "Preparing…" : "Start Pause"}
              </button>
            </div>
          </>
        )}

        {process.env.NODE_ENV === "development" ? (
          <section
            aria-label="Dev: Return to Me testing"
            className="space-y-2 rounded-[var(--ds-radius-sm)] border border-dashed px-3 py-3 text-xs"
            style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
          >
            <p className="font-semibold">DEV — Return to Me testing</p>
            <p>Current clock offset: {devOffsetMs}ms</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyDevOffset(26 * 60 * 60 * 1000)}
                className="ds-tap min-h-9 rounded-full border px-3 font-medium"
                style={{ borderColor: "var(--ds-border)" }}
              >
                Fast-forward +26h (make eligible)
              </button>
              <button
                type="button"
                onClick={() => {
                  clearDevNowOffset();
                  setDevOffsetMs(0);
                  window.location.reload();
                }}
                className="ds-tap min-h-9 rounded-full border px-3 font-medium"
                style={{ borderColor: "var(--ds-border)" }}
              >
                Reset clock
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </PauseShell>
  );
}

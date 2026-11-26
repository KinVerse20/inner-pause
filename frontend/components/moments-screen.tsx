"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState, ViewTransition } from "react";

import { MomentEmblem } from "@/components/moment-emblem";
import { OutcomeEmblem } from "@/components/outcome-emblem";
import { IconChevronDown, IconChevronRight, IconMic, IconPencil, IconSignpost } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { ReturnToMeBanner } from "@/components/return-to-me-banner";
import { TileMotif } from "@/components/tile-motif";
import {
  composeBigMomentPause,
  getSituationOptions,
  SITUATIONS_SHOWN_FIRST,
  type BigMomentMode,
  type SituationOption,
} from "@/lib/big-moment-engine";
import { clearDevNowOffset, getDevNowOffsetMs, setDevNowOffsetMs } from "@/lib/dev-clock";
import { haptic } from "@/lib/haptics";
import { createMomentRecord } from "@/lib/moment-storage";
import { createPauseRecord } from "@/lib/pause-storage";
import { computeInitialReturnToMeState } from "@/lib/return-to-me";
import { vtName } from "@/lib/view-transition";

// docs/PRODUCT_FLOW.md §11-14: mode is chosen first — "Coming up" /
// "Happening now" / "Just happened" are the user-facing labels for
// BEFORE/DURING/AFTER. Each mode is a tile built like Home's outcome tiles
// (tint wash, corner motif, illustrated emblem) so the two tabs feel like
// one app, with a few everyday examples so you recognise your moment.
const modes: Array<{
  id: BigMomentMode;
  label: string;
  purpose: string;
  examples: string;
  tone: string;
}> = [
  { id: "before", label: "Coming up", purpose: "Get ready", examples: "An interview, an exam, a first day", tone: "focus" },
  { id: "during", label: "Happening now", purpose: "Stay with yourself", examples: "An argument, a racing mind", tone: "reset" },
  { id: "after", label: "Just happened", purpose: "Come back to yourself", examples: "A fight, a mistake, hard news", tone: "sleep" },
];

const MODE_HEADLINE: Record<BigMomentMode, string> = {
  before: "What’s coming up?",
  during: "What’s happening?",
  after: "What just happened?",
};

type View = { kind: "modes" } | { kind: "mode"; mode: BigMomentMode } | { kind: "explore" };

export function MomentsScreen() {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: "modes" });
  const [showAll, setShowAll] = useState(false);
  const [startingKey, setStartingKey] = useState<string | null>(null);
  // Read after mount, not in a lazy useState initializer — the initializer
  // runs during SSR too (where localStorage doesn't exist).
  const [devOffsetMs, setDevOffsetMs] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDevOffsetMs(getDevNowOffsetMs());
  }, []);

  // A transition, so a mode card grows into the mode's header panel and
  // shrinks back on the way out (lib/view-transition.ts).
  const go = (next: View) => {
    haptic("tap");
    window.scrollTo({ top: 0 });
    startTransition(() => {
      setShowAll(false);
      setView(next);
    });
  };

  // Reuses the Core Pause engine end to end — composeBigMomentPause only
  // overrides mode-specific fields. A Moment record is created only when
  // there's a chosen situation, never merely from picking a mode (§5, §7).
  const startPause = (modeId: BigMomentMode, situation: SituationOption | null) => {
    if (startingKey) return;
    haptic("moment");
    setStartingKey(`${modeId}:${situation?.id ?? "none"}`);
    const definition = composeBigMomentPause(modeId, { situationId: situation?.id ?? null });
    const record = createPauseRecord(definition);
    if (situation) {
      createMomentRecord({
        mode: modeId,
        situationId: situation.id,
        situationLabel: situation.label,
        linkedPauseRecordId: record.id,
        returnToMe: computeInitialReturnToMeState(modeId, true),
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
      {view.kind === "modes" ? (
        <div key="modes" className="ds-settle space-y-6 pb-4 pt-2">
          <div>
            <h1 className="ds-display text-[1.85rem] sm:text-[2.15rem]">For the big moments in your life</h1>
            <p className="mt-2.5 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              We&rsquo;re here for before, during and after what matters.
            </p>
          </div>

          <ReturnToMeBanner />

          <section aria-label="Choose when" className="grid grid-cols-1 gap-3">
            {modes.map((item) => (
              <ViewTransition key={item.id} name={vtName("moment-mode", item.id)} share="expand" default="none">
              <button
                type="button"
                onClick={() => go({ kind: "mode", mode: item.id })}
                className="ds-card ds-card-lift ds-tap outcome-tile flex min-h-[6.75rem] w-full items-center gap-3.5 py-4 pl-3.5 pr-4 text-left"
                style={{ ["--tile-color" as string]: `var(--ds-outcome-${item.tone})` }}
              >
                <TileMotif id={`moment-${item.id}`} size="h-28 w-28" />
                <MomentEmblem mode={item.id} tone={item.tone} className="h-16 w-16 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="ds-h3 block">{item.label}</span>
                  <span className="mt-0.5 block text-[0.88rem] font-medium leading-5" style={{ color: `color-mix(in srgb, var(--ds-outcome-${item.tone}) 55%, var(--ds-text))` }}>
                    {item.purpose}
                  </span>
                  <span className="mt-1 block text-[0.8rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                    {item.examples}
                  </span>
                </span>
                <IconChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--ds-text-muted)" }} />
              </button>
              </ViewTransition>
            ))}
          </section>

          {/* Built like Home's "What's on your mind?" card. */}
          <button
            type="button"
            onClick={() => go({ kind: "explore" })}
            className="ds-tap flex w-full items-center gap-3.5 rounded-[var(--ds-radius-lg)] px-4 py-4 text-left"
            style={{ background: "var(--ds-accent-soft)" }}
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
              style={{ background: "var(--ds-surface)", color: "var(--ds-accent-secondary)" }}
              aria-hidden="true"
            >
              <IconSignpost className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="ds-h3 block">Explore moments</span>
              <span className="mt-0.5 block text-[0.85rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                Find one like yours, or your own words.
              </span>
            </span>
            <IconChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--ds-text-muted)" }} />
          </button>
        </div>
      ) : null}

      {view.kind === "mode"
        ? (() => {
            const mode = modes.find((item) => item.id === view.mode)!;
            const situations = getSituationOptions(mode.id);
            const visible = showAll ? situations : situations.slice(0, SITUATIONS_SHOWN_FIRST);
            const hidden = situations.length - visible.length;
            return (
              <div key={`mode-${mode.id}`} className="ds-settle space-y-6 pb-4 pt-2">
                <header className="flex items-center justify-between gap-2">
                  <BackButton onClick={() => go({ kind: "modes" })} label="Back to Moments" />
                  <ModePill tone={mode.tone} text={`${mode.label} · ${mode.purpose}`} />
                </header>

                {/* The mode tile, opened: same wash, motif and emblem. */}
                <ViewTransition name={vtName("moment-mode", mode.id)} share="expand" default="none">
                  <div
                    className="ds-card outcome-tile px-5 pb-5 pt-4"
                    style={{ ["--tile-color" as string]: `var(--ds-outcome-${mode.tone})` }}
                  >
                    <TileMotif id={`moment-${mode.id}`} size="h-32 w-32" />
                    <MomentEmblem mode={mode.id} tone={mode.tone} className="h-16 w-16" />
                    <h1 className="ds-display mt-2 text-[1.75rem] sm:text-[2rem]">{MODE_HEADLINE[mode.id]}</h1>
                    <p className="mt-2 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                      Choose what&rsquo;s closest. Your Pause starts right away.
                    </p>
                  </div>
                </ViewTransition>

                <section aria-label="Choose a moment">
                  <div className="ds-card divide-y divide-[color:var(--ds-border)] overflow-hidden">
                    {visible.map((situation) => (
                      <SituationRow
                        key={situation.id}
                        situation={situation}
                        starting={startingKey === `${mode.id}:${situation.id}`}
                        disabled={startingKey !== null}
                        onSelect={() => startPause(mode.id, situation)}
                      />
                    ))}
                  </div>
                  {hidden > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        haptic("tap");
                        setShowAll(true);
                      }}
                      className="ds-tap mx-auto mt-3 flex min-h-11 items-center gap-1 rounded-full px-4 text-sm font-semibold"
                      style={{ color: "var(--ds-accent)" }}
                    >
                      {hidden} more moments
                      <IconChevronDown className="h-4 w-4" />
                    </button>
                  ) : null}
                </section>

                <section aria-labelledby="moment-tell-title" className="rounded-[var(--ds-radius-lg)] px-5 py-5" style={{ background: "var(--ds-accent-soft)" }}>
                  <h2 id="moment-tell-title" className="ds-h3">Not quite it?</h2>
                  <p className="mt-1 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                    Say it or write it in your own words.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <Link href={`/tell?momentMode=${mode.id}`} className="ds-outlined" style={{ borderColor: "transparent" }} onClick={() => haptic("tap")}>
                      <IconPencil className="h-[1.05rem] w-[1.05rem]" />
                      Write
                    </Link>
                    <Link href={`/tell?momentMode=${mode.id}&mode=speak`} className="ds-outlined" style={{ borderColor: "transparent" }} onClick={() => haptic("tap")}>
                      <IconMic className="h-[1.05rem] w-[1.05rem]" />
                      Speak
                    </Link>
                  </div>
                </section>

                <button
                  type="button"
                  disabled={startingKey !== null}
                  onClick={() => startPause(mode.id, null)}
                  className="ds-outlined w-full"
                >
                  {startingKey === `${mode.id}:none` ? "Starting your Pause" : "Begin my Pause"}
                </button>
              </div>
            );
          })()
        : null}

      {view.kind === "explore" ? (
        <div key="explore" className="ds-settle space-y-6 pb-4 pt-2">
          <BackButton onClick={() => go({ kind: "modes" })} label="Back to Moments" />
          <div>
            <h1 className="ds-display text-[1.75rem] sm:text-[2rem]">Explore moments</h1>
            <p className="mt-2 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              Pick the one closest to yours. Each opens a ready-made Pause.
            </p>
          </div>
          {modes.map((mode) => (
            <section key={mode.id} aria-labelledby={`explore-${mode.id}`} className="ds-card overflow-hidden">
              {/* Each group headed like its mode's tile. */}
              <h2
                id={`explore-${mode.id}`}
                className="outcome-tile flex items-center gap-3 px-4 py-3"
                style={{ ["--tile-color" as string]: `var(--ds-outcome-${mode.tone})` }}
              >
                <TileMotif id={`moment-${mode.id}`} size="h-28 w-28" />
                <MomentEmblem mode={mode.id} tone={mode.tone} className="h-11 w-11 shrink-0" />
                <span className="min-w-0">
                  <span className="ds-h3 block">{mode.label}</span>
                  <span className="block text-[0.82rem] font-normal" style={{ color: "var(--ds-text-secondary)" }}>
                    {mode.purpose}
                  </span>
                </span>
              </h2>
              <div className="divide-y divide-[color:var(--ds-border)]">
                {getSituationOptions(mode.id)
                  .filter((situation) => situation.id !== "something-else")
                  .map((situation) => (
                    <SituationRow
                      key={situation.id}
                      situation={situation}
                      starting={startingKey === `${mode.id}:${situation.id}`}
                      disabled={startingKey !== null}
                      onSelect={() => startPause(mode.id, situation)}
                    />
                  ))}
              </div>
            </section>
          ))}

          {/* Starting from scratch: your own moment, in your own words. */}
          <section aria-labelledby="explore-own" className="rounded-[var(--ds-radius-lg)] px-5 py-5" style={{ background: "var(--ds-accent-soft)" }}>
            <h2 id="explore-own" className="ds-h3">
              Yours isn&rsquo;t here?
            </h2>
            <p className="mt-1 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              Start from scratch. Say what&rsquo;s happening in your own words, and we&rsquo;ll find the right Pause for it.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link href="/tell" className="ds-outlined" style={{ borderColor: "transparent" }} onClick={() => haptic("tap")}>
                <IconPencil className="h-4 w-4" />
                Write
              </Link>
              <Link href="/tell?mode=speak" className="ds-outlined" style={{ borderColor: "transparent" }} onClick={() => haptic("tap")}>
                <IconMic className="h-4 w-4" />
                Speak
              </Link>
            </div>
          </section>
        </div>
      ) : null}

      {process.env.NODE_ENV === "development" ? (
        <section
          aria-label="Dev: Return to Me testing"
          className="mt-6 space-y-2 rounded-[var(--ds-radius-sm)] border border-dashed px-3 py-3 text-xs"
          style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
        >
          <p className="font-semibold">DEV · Return to Me testing</p>
          <p>Current clock offset: {devOffsetMs}ms</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyDevOffset(26 * 60 * 60 * 1000)}
              className="ds-tap min-h-11 rounded-full border px-3 font-medium"
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
              className="ds-tap min-h-11 rounded-full border px-3 font-medium"
              style={{ borderColor: "var(--ds-border)" }}
            >
              Reset clock
            </button>
          </div>
        </section>
      ) : null}
    </PauseShell>
  );
}

function SituationRow({
  situation,
  starting,
  disabled,
  onSelect,
}: {
  situation: SituationOption;
  starting: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled && !starting}
      aria-busy={starting || undefined}
      className="ds-tap flex min-h-[4.25rem] w-full items-center gap-3 px-3.5 py-3 text-left"
      style={{ borderColor: "var(--ds-border)", background: starting ? "var(--ds-accent-soft)" : undefined }}
    >
      {/* The feeling this Pause works on, as on Home's tiles. */}
      <OutcomeEmblem id={situation.categoryId} className={`h-11 w-11 shrink-0 ${starting ? "ds-breathe" : ""}`} />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.95rem] font-medium leading-6">{situation.label}</span>
        {situation.subtitle ? (
          <span className="block text-[0.82rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
            {starting ? "Starting your Pause" : situation.subtitle}
          </span>
        ) : null}
      </span>
      <IconChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--ds-text-muted)" }} />
    </button>
  );
}

function ModePill({ tone, text }: { tone: string; text: string }) {
  return (
    <span
      className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ background: `color-mix(in srgb, var(--ds-outcome-${tone}) 14%, var(--ds-surface))` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: `var(--ds-outcome-${tone})` }} />
      <span className="ds-label truncate" style={{ color: "var(--ds-text)" }}>
        {text}
      </span>
    </span>
  );
}

function BackButton({ href, onClick, label }: { href?: string; onClick?: () => void; label: string }) {
  const content = <IconChevronRight className="h-4 w-4" style={{ transform: "scaleX(-1)" }} />;
  const style = { background: "var(--ds-surface)", color: "var(--ds-text)", boxShadow: "var(--ds-elevation-1)" };
  return href ? (
    <Link href={href} aria-label={label} className="ds-icon-btn" style={style}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className="ds-icon-btn" style={style}>
      {content}
    </button>
  );
}

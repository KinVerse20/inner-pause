"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";

import {
  IconFeather,
  IconFocus,
  IconMic,
  IconMoon,
  IconPencil,
  IconReset,
  IconSpark,
  IconWave,
} from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { pauseCategories, type PauseCategoryId } from "@/lib/pause-categories";
import { composeRightNowPause } from "@/lib/pause-engine";
import { createPauseRecord } from "@/lib/pause-storage";

// docs/PRODUCT_FLOW.md §5's six Right Now outcomes, in the fixed order the
// data model already uses (lib/pause-categories.ts).
const outcomeIcons: Record<PauseCategoryId, ComponentType<{ className?: string }>> = {
  sleep: IconMoon,
  reset: IconReset,
  focus: IconFocus,
  confidence: IconSpark,
  calm: IconWave,
  release: IconFeather,
};

// Locked subtitle copy (Home implementation brief) — pairs with each outcome.
const outcomeSubtitles: Record<PauseCategoryId, string> = {
  sleep: "Rest deeply",
  reset: "Start fresh",
  focus: "Find your flow",
  confidence: "Feel more capable",
  calm: "Feel more at ease",
  release: "Let it go",
};

// Home's content is locked to exactly three sections
// (docs/PRODUCT_FLOW.md §5, "Home contains only these three sections") —
// Right Now, the Tell Inner Pause hero, and the Moments doorway. Nothing
// else belongs here: no Continue Practice, no Return to Me, no suggestion
// or discovery modules.
export function PauseHomeScreen() {
  const router = useRouter();
  const [startingId, setStartingId] = useState<PauseCategoryId | null>(null);

  // Right Now direct tile taps go straight into the Pause with the minimum
  // possible steps — no intermediate screen (docs/PRODUCT_FLOW.md §6/§7).
  const handleRightNow = (id: PauseCategoryId) => {
    if (startingId) return;
    setStartingId(id);
    const record = createPauseRecord(composeRightNowPause(id));
    router.push(`/pause/player?session=${record.id}`);
  };

  return (
    <PauseShell>
      <div className="space-y-7 pb-4 pt-2">
        {/* 1. Primary — Right Now */}
        <section aria-label="What do you need right now?">
          <h1 className="text-[1.55rem] font-semibold leading-[1.18] tracking-[-0.01em] sm:text-[1.85rem]">
            What do you need right now?
          </h1>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {pauseCategories.map((category) => {
              const Icon = outcomeIcons[category.id];
              const isStarting = startingId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  disabled={startingId !== null}
                  onClick={() => handleRightNow(category.id)}
                  className="ds-tap flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-[var(--ds-radius-md)] px-1.5 py-2.5 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] disabled:cursor-not-allowed disabled:opacity-55"
                  style={{ background: "var(--ds-surface)" }}
                >
                  <span
                    className="ds-outcome-icon grid h-8 w-8 place-items-center rounded-full"
                    style={{ ["--ds-outcome-color" as string]: `var(--ds-outcome-${category.id})` }}
                  >
                    <Icon className="h-[1rem] w-[1rem]" />
                  </span>
                  <span className="mt-0.5 text-[0.76rem] font-semibold leading-tight">
                    {isStarting ? "Preparing…" : category.label}
                  </span>
                  {!isStarting ? (
                    <span className="text-[0.62rem] leading-tight" style={{ color: "var(--ds-text-secondary)" }}>
                      {outcomeSubtitles[category.id]}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Hero interaction — Tell Inner Pause. The strongest secondary
            interaction on Home: warm accent wash, equal-weight Write/Speak
            actions, no questionnaire, no mandatory emotion selection. */}
        <section aria-label="What's on your mind?">
          <div className="rounded-[var(--ds-radius-lg)] px-5 py-5" style={{ background: "var(--ds-accent-soft)" }}>
            <h2 className="text-[1.05rem] font-semibold">What&rsquo;s on your mind?</h2>
            <p className="mt-1 text-sm leading-5" style={{ color: "var(--ds-text-secondary)" }}>
              Say it or write it. We&rsquo;ll help you find the right Pause.
            </p>
            <div className="mt-4 flex gap-2.5">
              <Link
                href="/tell"
                className="ds-tap flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
                style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
              >
                <IconPencil className="h-[1.05rem] w-[1.05rem]" />
                Write
              </Link>
              <Link
                href="/tell?mode=speak"
                className="ds-tap flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
                style={{ borderColor: "var(--ds-accent)", color: "var(--ds-accent)", background: "var(--ds-surface)" }}
              >
                <IconMic className="h-[1.05rem] w-[1.05rem]" />
                Speak
              </Link>
            </div>
          </div>
        </section>

        {/* 3. Moments doorway — small and visually secondary. No mode
            labels, no moment tiles here; both live on /moments only. */}
        <section aria-label="For what's happening in your life">
          <Link
            href="/moments"
            className="ds-tap flex items-center justify-between gap-3 rounded-[var(--ds-radius-sm)] border px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ borderColor: "var(--ds-border)" }}
          >
            <div className="min-w-0">
              <p className="text-[0.82rem] font-semibold leading-snug">For what&rsquo;s happening in your life</p>
              <p className="mt-0.5 text-[0.72rem] leading-snug" style={{ color: "var(--ds-text-secondary)" }}>
                Before an interview · during a tough conversation · after an argument
              </p>
            </div>
            <span className="shrink-0 whitespace-nowrap text-[0.78rem] font-semibold" style={{ color: "var(--ds-accent)" }}>
              Explore →
            </span>
          </Link>
        </section>
      </div>
    </PauseShell>
  );
}

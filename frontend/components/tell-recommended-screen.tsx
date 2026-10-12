"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { IconChevronRight } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { WhyThisPausePanel } from "@/components/why-this-pause-panel";
import { chakraMap } from "@/data/chakras";
import { composeBigMomentPause } from "@/lib/big-moment-engine";
import { createMomentRecord } from "@/lib/moment-storage";
import { pauseCategoryMap, type PauseCategoryId } from "@/lib/pause-categories";
import { composeRightNowPause } from "@/lib/pause-engine";
import { createPauseRecord } from "@/lib/pause-storage";
import { computeInitialReturnToMeState } from "@/lib/return-to-me";
import { getTellEntry, linkTellEntryToMoment, linkTellEntryToPause, type TellEntry } from "@/lib/tell-storage";

// Recommended Pause (docs/UX_ARCHITECTURE.md §2): briefly show what Inner
// Pause selected before committing, since the intent was inferred, not
// explicitly chosen. When the interpretation was ambiguous (or found no
// clear signal at all), shows a short set of candidate Pauses instead of a
// single confirmed pick — the "Tell me a little more" / "show a small set
// of relevant Pause choices" fallback from docs/PRODUCT_FLOW.md's failure
// states, without an open-ended conversational loop.
export function TellRecommendedScreen() {
  const router = useRouter();
  const entryId = useSearchParams().get("entry");
  const [entry, setEntry] = useState<TellEntry | null | undefined>(undefined);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!entryId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntry(null);
      return;
    }
    setEntry(getTellEntry(entryId));
  }, [entryId]);

  // "Tell Pause instead" within a Big Moment mode (this slice's brief §4)
  // carries the mode through onto the entry, composes via the Big Moment
  // engine instead of a plain Right Now Pause, and creates the Moment here
  // — the same "meaningful content -> Moment" rule as the situation-tile
  // path in components/moments-screen.tsx (§7), since a real Tell
  // expression is itself meaningful specific content.
  const startPause = (categoryId: PauseCategoryId) => {
    if (!entry || starting) return;
    setStarting(true);
    const definition = entry.momentMode
      ? composeBigMomentPause(entry.momentMode, { categoryId })
      : composeRightNowPause(categoryId);
    const record = createPauseRecord(definition);
    linkTellEntryToPause(entry.id, record.id);

    if (entry.momentMode) {
      const returnToMe = computeInitialReturnToMeState(entry.momentMode, true);
      const moment = createMomentRecord({
        mode: entry.momentMode,
        situationId: null,
        situationLabel: null,
        linkedPauseRecordId: record.id,
        expression: entry.text,
        returnToMe,
      });
      linkTellEntryToMoment(entry.id, moment.id);
    }

    router.push(`/pause/player?session=${record.id}`);
  };

  if (entry === undefined) {
    return (
      <PauseShell>
        <p className="pt-8 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
          Finding the right Pause…
        </p>
      </PauseShell>
    );
  }

  if (entry === null) {
    return (
      <PauseShell>
        <div className="space-y-4 pt-8 text-center">
          <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            We couldn&rsquo;t find that entry.
          </p>
          <Link
            href="/tell"
            className="ds-tap inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
          >
            Try again
          </Link>
        </div>
      </PauseShell>
    );
  }

  const { interpretation } = entry;
  const isConfident = interpretation.status === "confident" && interpretation.primary;
  const tellHref = entry.momentMode ? `/tell?momentMode=${entry.momentMode}` : "/tell";

  return (
    <PauseShell>
      <div className="space-y-5 pb-4 pt-2">
        <header>
          <Link
            href={tellHref}
            className="ds-tap inline-flex items-center gap-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            <IconChevronRight className="h-3.5 w-3.5" style={{ transform: "scaleX(-1)" }} />
            Back
          </Link>
        </header>

        {isConfident && interpretation.primary ? (
          <ConfidentPause
            categoryId={interpretation.primary}
            rationale={interpretation.rationale}
            onStart={() => startPause(interpretation.primary as PauseCategoryId)}
            starting={starting}
          />
        ) : interpretation.status === "unclear" ? (
          <UnclearFallback candidates={interpretation.candidates} onChoose={startPause} starting={starting} tellHref={tellHref} />
        ) : (
          <AmbiguousChoices
            reflection={interpretation.reflection}
            candidates={interpretation.candidates}
            onChoose={startPause}
            starting={starting}
          />
        )}
      </div>
    </PauseShell>
  );
}

function ConfidentPause({
  categoryId,
  rationale,
  onStart,
  starting,
}: {
  categoryId: PauseCategoryId;
  rationale: string;
  onStart: () => void;
  starting: boolean;
}) {
  const category = pauseCategoryMap[categoryId];
  const chakra = chakraMap[category.chakraId];

  return (
    <section className="space-y-4 rounded-[var(--ds-radius-lg)] px-5 py-6 text-center" style={{ background: "var(--ds-surface)" }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ds-text-muted)" }}>
        Recommended for you
      </p>
      <h1 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.01em]">{category.label} Pause</h1>
      <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
        {rationale}
      </p>

      <WhyThisPausePanel
        input={{
          chakraName: chakra.name,
          traditionalAssociation: chakra.meaning,
          frequencyLabel: chakra.frequencyLabel,
          intentLabel: category.tagline,
        }}
      />

      <button
        type="button"
        disabled={starting}
        onClick={onStart}
        className="ds-tap min-h-12 w-full rounded-full text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
      >
        {starting ? "Preparing…" : "Start Pause"}
      </button>
    </section>
  );
}

// Ambiguous state (docs/PRODUCT_FLOW.md §16): a candidate set, connected
// back to what the user actually said via the reflection line — never bare
// category cards.
function AmbiguousChoices({
  reflection,
  candidates,
  onChoose,
  starting,
}: {
  reflection?: string;
  candidates: PauseCategoryId[];
  onChoose: (categoryId: PauseCategoryId) => void;
  starting: boolean;
}) {
  return (
    <section className="space-y-3.5">
      {reflection ? (
        <p className="text-sm italic" style={{ color: "var(--ds-text-secondary)" }}>
          {reflection}
        </p>
      ) : null}
      <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
        A few different Pauses could help. Pick what feels closest.
      </p>
      <CandidateList candidates={candidates} onChoose={onChoose} starting={starting} />
    </section>
  );
}

// Unclear state (docs/PRODUCT_FLOW.md §16): honest about not having a
// confident read, offers to hear more, and a safe manual fallback — never a
// pretense of understanding, never a loop.
function UnclearFallback({
  candidates,
  onChoose,
  starting,
  tellHref,
}: {
  candidates: PauseCategoryId[];
  onChoose: (categoryId: PauseCategoryId) => void;
  starting: boolean;
  tellHref: string;
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-3.5 rounded-[var(--ds-radius-lg)] px-5 py-6 text-center" style={{ background: "var(--ds-surface)" }}>
        <p className="text-base font-semibold">I want to make sure I get this right.</p>
        <Link
          href={tellHref}
          className="ds-tap inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
          style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
        >
          Tell me a little more
        </Link>
      </div>

      <div className="space-y-2.5">
        <p className="text-xs font-medium" style={{ color: "var(--ds-text-muted)" }}>
          Or start with one of these
        </p>
        <CandidateList candidates={candidates} onChoose={onChoose} starting={starting} />
      </div>
    </section>
  );
}

function CandidateList({
  candidates,
  onChoose,
  starting,
}: {
  candidates: PauseCategoryId[];
  onChoose: (categoryId: PauseCategoryId) => void;
  starting: boolean;
}) {
  return (
    <div className="space-y-2.5">
      {candidates.map((categoryId) => {
        const category = pauseCategoryMap[categoryId];
        return (
          <button
            key={categoryId}
            type="button"
            disabled={starting}
            onClick={() => onChoose(categoryId)}
            className="ds-tap flex w-full items-center justify-between gap-3 rounded-[var(--ds-radius-md)] px-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "var(--ds-surface)" }}
          >
            <span className="min-w-0">
              <span className="block text-[0.98rem] font-semibold">{category.label}</span>
              <span className="block text-[0.8rem]" style={{ color: "var(--ds-text-secondary)" }}>
                {category.tagline}
              </span>
            </span>
            <IconChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--ds-text-muted)" }} />
          </button>
        );
      })}
    </div>
  );
}

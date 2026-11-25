"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CardIcon } from "@/components/card-icon";
import { IconChevronRight } from "@/components/pause-icons";
import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { PauseShell } from "@/components/pause-shell";
import { TileMotif } from "@/components/tile-motif";
import { WhyThisPausePanel } from "@/components/why-this-pause-panel";
import { chakraMap } from "@/data/chakras";
import { composeBigMomentPause } from "@/lib/big-moment-engine";
import { getCard } from "@/lib/content-store";
import { haptic } from "@/lib/haptics";
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
    haptic("moment");
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
        <div className="grid justify-items-center gap-5 pt-24 text-center">
          <HarmonyFormVisual playing className="ds-only-light ds-breathe w-24" />
          <HarmonyFormVisual playing dark className="ds-only-dark ds-breathe w-24" />
          <p className="text-[0.95rem]" style={{ color: "var(--ds-text-secondary)" }}>
            Finding the right Pause
          </p>
        </div>
      </PauseShell>
    );
  }

  if (entry === null) {
    return (
      <PauseShell>
        <div className="grid justify-items-center gap-3 pt-20 text-center">
          <HarmonyFormVisual playing={false} className="ds-only-light w-24 opacity-80" />
          <HarmonyFormVisual playing={false} dark className="ds-only-dark w-24 opacity-80" />
          <h1 className="ds-h2 mt-4">That entry isn&rsquo;t here</h1>
          <p className="max-w-[17rem] text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
            It may have been cleared. Say what&rsquo;s on your mind again, and we&rsquo;ll find the right Pause.
          </p>
          <Link href="/tell" className="ds-filled mt-3 px-8">
            Write it again
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
      <div className="ds-settle space-y-6 pb-4 pt-2">
        <header>
          <Link
            href={tellHref}
            aria-label="Back to what's on your mind"
            className="ds-icon-btn"
            style={{ background: "var(--ds-surface)", color: "var(--ds-text)", boxShadow: "var(--ds-elevation-1)" }}
          >
            <IconChevronRight className="h-4 w-4" style={{ transform: "scaleX(-1)" }} />
          </Link>
        </header>

        <WhatYouShared entry={entry} />

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
          <section className="space-y-3">
            <h1 className="ds-h2">A few Pauses could help</h1>
            <p className="text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              Pick the one that feels closest right now.
            </p>
            <CandidateList candidates={interpretation.candidates} onChoose={startPause} starting={starting} />
          </section>
        )}
      </div>
    </PauseShell>
  );
}

// What the person shared, kept as a small keepsake (the same paper as the
// journal), so the recommendation is visibly about their words. Feelings
// picked without writing show as the feelings themselves.
function WhatYouShared({ entry }: { entry: TellEntry }) {
  const feelingsOnly = entry.chips.length > 0 && entry.text === entry.chips.join(", ");
  return (
    <section aria-label="What you shared" className="journal-paper relative rounded-[var(--ds-radius-lg)] px-5 pb-4 pt-6">
      <span className="journal-tape" aria-hidden="true" />
      <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
        {feelingsOnly ? "How you feel" : entry.source === "speak" ? "What you said" : "What you wrote"}
      </p>
      {feelingsOnly ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {entry.chips.map((chip) => (
            <span key={chip} className="rounded-full px-3 py-1.5 text-sm font-medium" style={{ background: "var(--ds-accent-soft)" }}>
              {chip}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-1.5 text-[1rem] leading-7">
          {entry.text.length > 200 ? `${entry.text.slice(0, 200).trimEnd()}…` : entry.text}
        </p>
      )}
      <p className="ds-caption mt-3">Saved to your journal</p>
    </section>
  );
}

// Why this one, in our voice — gentle, never presuming too much. Falls back
// to the classifier's own line for admin-created categories.
const WHY_THIS_ONE: Partial<Record<PauseCategoryId, string>> = {
  sleep: "It sounds like your mind is still awake. This Pause helps it slow down for rest.",
  reset: "It sounds like a lot is happening at once. This Pause gives you a fresh start.",
  focus: "It sounds like your attention is pulled in many directions. This Pause helps you find one clear point.",
  confidence: "It sounds like something ahead matters to you. This Pause helps you feel steady and capable.",
  calm: "It sounds like you are on edge. This Pause helps your body slow down and settle.",
  release: "It sounds like you are carrying something heavy. This Pause helps you set a little of it down.",
};

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
  const card = getCard(categoryId);
  const category = card ?? pauseCategoryMap[categoryId];
  const chakra = chakraMap[category.chakraId];

  return (
    <section
      className="outcome-tile ds-card space-y-4 px-5 pb-5 pt-6"
      style={{ ["--tile-color" as string]: `var(--ds-outcome-${categoryId})` }}
    >
      <TileMotif id={categoryId} size="h-32 w-32" />
      <div className="flex items-center gap-3">
        <span
          className="ds-outcome-icon grid h-12 w-12 shrink-0 place-items-center rounded-full"
          style={{ ["--ds-outcome-color" as string]: `var(--ds-outcome-${categoryId})` }}
          aria-hidden="true"
        >
          {card ? <CardIcon icon={card.icon} className="h-[1.3rem] w-[1.3rem]" /> : null}
        </span>
        <div>
          <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
            A Pause for you
          </p>
          <h1 className="ds-display text-[1.6rem]">{category.label} Pause</h1>
        </div>
      </div>
      <p className="text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
        {WHY_THIS_ONE[categoryId] ?? rationale}
      </p>

      <WhyThisPausePanel
        input={{
          chakraName: chakra.name,
          traditionalAssociation: chakra.meaning,
          frequencyLabel: chakra.frequencyLabel,
          intentLabel: category.tagline,
        }}
      />

      <button type="button" disabled={starting} onClick={onStart} className="ds-filled w-full">
        {starting ? "Starting your Pause" : "Start Pause"}
      </button>
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
      <div className="ds-card ds-wash space-y-3 px-5 py-6 text-center">
        <h1 className="ds-h2">I want to get this right.</h1>
        <p className="text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
          A few more words would help me find the right Pause.
        </p>
        <Link href={tellHref} className="ds-filled" onClick={() => haptic("tap")}>
          Tell me a little more
        </Link>
      </div>

      <div className="space-y-2.5">
        <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
          Or start with one of these
        </p>
        <CandidateList candidates={candidates} onChoose={onChoose} starting={starting} />
      </div>
    </section>
  );
}

// Candidates look like the Home tiles they are: tint, motif, icon.
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
        const card = getCard(categoryId);
        const category = card ?? pauseCategoryMap[categoryId];
        return (
          <button
            key={categoryId}
            type="button"
            disabled={starting}
            onClick={() => onChoose(categoryId)}
            className="ds-card ds-tap outcome-tile flex min-h-[4.75rem] w-full items-center gap-3.5 px-4 py-3.5 text-left"
            style={{ ["--tile-color" as string]: `var(--ds-outcome-${categoryId})` }}
          >
            <TileMotif id={categoryId} />
            <span
              className="ds-outcome-icon grid h-11 w-11 shrink-0 place-items-center rounded-full"
              style={{ ["--ds-outcome-color" as string]: `var(--ds-outcome-${categoryId})` }}
              aria-hidden="true"
            >
              {card ? <CardIcon icon={card.icon} className="h-5 w-5" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="ds-h3 block">{category.label}</span>
              <span className="block text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
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

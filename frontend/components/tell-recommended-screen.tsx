"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { planFeelingStops, tellEmotions, type PauseStop } from "@inner-pause/shared";

import { CardIcon } from "@/components/card-icon";
import { IconChevronRight, IconSliders } from "@/components/pause-icons";
import { CENTRE_NAME } from "@/components/pause-session";
import { SoundSheet, type ToneSetting } from "@/components/sound-sheet";
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
import { composeFeelingsPause, composeRightNowPause, feelingsPauseSound, RIGHT_NOW_DURATION_SECONDS } from "@/lib/pause-engine";
import { getPreferences, updatePreferences } from "@/lib/preferences-store";
import { findBuiltInSound, UNDERTONE_LEVELS, type BuiltInSoundId, type UndertoneLevel } from "@/lib/sound-library";
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
  // Feelings picked (outside Moments): a Pause with a stop for each centre.
  const feelings = entry.momentMode ? [] : entry.chips.filter((chip) => tellEmotions.includes(chip));
  const feelingsOnly = entry.text === entry.chips.join(", ");

  if (feelings.length > 0 && planFeelingStops(feelings, RIGHT_NOW_DURATION_SECONDS).length > 0) {
    return (
      <PauseShell>
        <div className="ds-settle space-y-6 pb-4 pt-2">
          <header>
            <Link href={tellHref} aria-label="Back to what's on your mind" className="ds-icon-btn" style={{ background: "var(--ds-surface)", color: "var(--ds-text)", boxShadow: "var(--ds-elevation-1)" }}>
              <IconChevronRight className="h-4 w-4" style={{ transform: "scaleX(-1)" }} />
            </Link>
          </header>
          {feelingsOnly ? null : <WhatYouShared entry={entry} />}
          <YourPause entry={entry} feelings={feelings} />
        </div>
      </PauseShell>
    );
  }

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
          <p className="ds-label uppercase" style={{ color: "var(--ds-text-secondary)" }}>
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
        {starting ? "Starting your Pause" : "Begin my Pause"}
      </button>
    </section>
  );
}

// "Your Pause": the feelings you picked, each at its centre, one after
// another, root to crown, sharing ten minutes. Visible before you begin,
// nothing to fill in: the sound is already chosen (change it if you like),
// and "Begin my Pause" is the only tap. Each centre opens its page.
function YourPause({ entry, feelings }: { entry: TellEntry; feelings: string[] }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const stops = planFeelingStops(feelings, RIGHT_NOW_DURATION_SECONDS);
  const [soundId, setSoundId] = useState<BuiltInSoundId>("rain");
  const [tone, setTone] = useState<ToneSetting>("balanced");
  const [level, setLevel] = useState<UndertoneLevel>("balanced");
  const [soundOpen, setSoundOpen] = useState(false);

  // Preferences live in localStorage, read after mount.
  useEffect(() => {
    const preferences = getPreferences();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoundId(feelingsPauseSound(stops.length));
    setTone(preferences.soundToneLayerEnabled ? preferences.undertone : "off");
    setLevel(preferences.undertone);
  }, [stops.length]);

  const begin = () => {
    if (starting) return;
    const definition = composeFeelingsPause(feelings);
    if (!definition) return;
    haptic("moment");
    setStarting(true);
    const record = createPauseRecord(definition);
    linkTellEntryToPause(entry.id, record.id);
    router.push(`/pause/player?session=${record.id}`);
  };

  const sound = findBuiltInSound(soundId);
  const levelLabel = (id: UndertoneLevel) => UNDERTONE_LEVELS.find((item) => item.id === id)?.label ?? "Balanced";
  const toneLabel = sound?.generated ? levelLabel(level) : tone === "off" ? "no tone" : `${levelLabel(tone)} tone`;

  return (
    <section className="ds-card space-y-5 px-5 pb-5 pt-6" aria-labelledby="your-pause-title">
      <h1 id="your-pause-title" className="ds-display text-[1.6rem]">
        Your Pause <span className="ds-num" style={{ color: "var(--ds-text-muted)" }}>· {RIGHT_NOW_DURATION_SECONDS / 60} min</span>
      </h1>

      <ol className="relative">
        {stops.map((stop, index) => (
          <StopRow key={stop.chakraId} stop={stop} last={index === stops.length - 1} />
        ))}
      </ol>

      <button
        type="button"
        onClick={() => {
          haptic("tap");
          setSoundOpen(true);
        }}
        aria-haspopup="dialog"
        className="ds-tap flex min-h-12 w-full items-center gap-3 rounded-[var(--ds-radius-md)] px-4 text-left"
        style={{ background: "var(--ds-accent-soft)" }}
      >
        <IconSliders className="h-4 w-4 shrink-0" />
        <span className="font-semibold">Sound</span>
        <span className="min-w-0 flex-1 truncate text-right text-[0.9rem]" style={{ color: "var(--ds-text-secondary)" }}>
          {sound?.label ?? "Rain"} · {toneLabel}
        </span>
        <IconChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--ds-text-muted)" }} />
      </button>

      <button type="button" disabled={starting} onClick={begin} className="ds-filled w-full">
        {starting ? "Starting your Pause" : "Begin my Pause"}
      </button>

      {soundOpen ? (
        <SoundSheet
          currentId={soundId}
          tone={tone}
          level={level}
          frequencyHz={stops.length === 1 ? stops[0].hz : null}
          frequencyLabel={stops.length === 1 ? `${stops[0].hz} Hz` : null}
          muted={false}
          severalFrequencies={stops.length > 1}
          onChoose={(id) => {
            haptic("tap");
            setSoundId(id);
            updatePreferences({ defaultSound: id, soundAmbientEnabled: true });
          }}
          onTone={(next) => {
            haptic("tap");
            if (next !== "off") setLevel(next);
            // Frequency only and Binaural: only how loud, the undertone setting stays.
            if (sound?.generated) {
              if (next !== "off") updatePreferences({ undertone: next });
              return;
            }
            setTone(next);
            updatePreferences(next === "off" ? { soundToneLayerEnabled: false } : { soundToneLayerEnabled: true, undertone: next });
          }}
          onClose={() => setSoundOpen(false)}
        />
      ) : null}
    </section>
  );
}

// One centre on the way: its colour, name and Hz, your words for it, and
// what it's traditionally linked with.
function StopRow({ stop, last }: { stop: PauseStop; last: boolean }) {
  const chakra = chakraMap[stop.chakraId];
  return (
    <li className="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-1">
      {last ? null : (
        <span className="absolute -bottom-[0.55rem] left-[0.75rem] top-[2.45rem] w-px -translate-x-1/2" style={{ background: "var(--ds-border)" }} aria-hidden="true" />
      )}
      <span className="mt-[0.9rem] grid h-6 w-6 place-items-center" aria-hidden="true">
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: chakra.color, boxShadow: `0 0 0 4px color-mix(in srgb, ${chakra.color} 22%, transparent)` }} />
      </span>
      <Link href={`/chakras/${stop.chakraId}?from=tell`} className="ds-tap block rounded-[var(--ds-radius-md)] py-2.5 pr-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="ds-h3">
            {CENTRE_NAME[stop.chakraId]} <span className="ds-num font-medium" style={{ color: "var(--ds-text-secondary)" }}>· {stop.hz} Hz</span>
          </span>
          <span className="ds-caption ds-num shrink-0">{stopLength(stop.seconds)}</span>
        </span>
        <span className="mt-0.5 block text-[0.95rem] font-medium">{stop.feelings.join(" · ")}</span>
        <span className="block text-[0.85rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
          {chakra.meaning}
        </span>
      </Link>
    </li>
  );
}

// "5 min", or "3:20" when a stop isn't whole minutes.
function stopLength(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest === 0 ? `${minutes} min` : `${minutes}:${String(rest).padStart(2, "0")}`;
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

"use client";

import { startTransition, useEffect, useState, ViewTransition } from "react";
import { createPortal } from "react-dom";

import { PauseShell } from "@/components/pause-shell";
import { YouHeader } from "@/components/you-avatar";
import { JournalComposer, JourneySummary, MomentOpened, StoryTimeline, buildStory } from "@/components/journey-story";
import { Stagger, StaggerItem } from "@/components/reveal";
import { haptic } from "@/lib/haptics";
import { getLinkedJournalEntries, listHighlights, type Highlight } from "@/lib/journey-highlights";
import { listMomentRecords } from "@/lib/moment-storage";
import { listPauseRecords, type PauseRecord } from "@/lib/pause-storage";
import { viewTransitionsSupported, vtName } from "@/lib/view-transition";
import { deleteTellEntry, listTellEntries, type TellEntry } from "@/lib/tell-storage";

// Patterns and Growth are off for now (founder, 27 Nov): Journey is your
// story and journal. Their code stays in lib/pattern-*.ts and
// lib/growth-model.ts for when they come back.

export function JourneyScreen() {
  const [pauses, setPauses] = useState<PauseRecord[]>([]);
  const [momentCount, setMomentCount] = useState(0);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [journalEntries, setJournalEntries] = useState<TellEntry[]>([]);

  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TellEntry | null>(null);
  const [entryOrigin, setEntryOrigin] = useState<"list" | "highlight">("list");

  const refresh = () => {
    setHighlights(listHighlights());
    setJournalEntries(listTellEntries());
    setPauses(listPauseRecords());
    setMomentCount(listMomentRecords().length);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const story = buildStory(journalEntries, highlights, pauses);

  // Opening and closing run as transitions, so a polaroid grows into the
  // opened Moment and a journal card into its sheet (lib/view-transition.ts).
  const openHighlight = (highlight: Highlight) => {
    startTransition(() => {
      setSelectedHighlight(highlight);
      setSelectedEntry(null);
    });
  };
  const closeHighlight = () => startTransition(() => setSelectedHighlight(null));
  const openEntryFromList = (entry: TellEntry) => {
    haptic("tap");
    startTransition(() => {
      setSelectedEntry(entry);
      setEntryOrigin("list");
    });
  };
  const openEntryFromHighlight = (entry: TellEntry) => {
    setSelectedEntry(entry);
    setEntryOrigin("highlight");
  };
  const closeEntry = () => startTransition(() => setSelectedEntry(null));
  const deleteEntry = (id: string) => {
    deleteTellEntry(id);
    setSelectedEntry(null);
    refresh();
  };


  return (
    <PauseShell>
      <Stagger className="space-y-5 pb-4 pt-2">
        <StaggerItem>
          <YouHeader />
        </StaggerItem>

        <StaggerItem>
          <JourneySummary pauses={pauses} entries={journalEntries} moments={momentCount} />
        </StaggerItem>

        <StaggerItem>
          <JournalComposer onSaved={refresh} />
        </StaggerItem>

        <StaggerItem className="space-y-5">

          {selectedHighlight ? (
              <MomentOpened highlight={selectedHighlight} linkedEntries={getLinkedJournalEntries(selectedHighlight)} onBack={closeHighlight} onOpenEntry={openEntryFromHighlight} />
            ) : (
              <StoryTimeline
                items={story}
                openEntryId={selectedEntry && entryOrigin === "list" ? selectedEntry.id : null}
                onOpenEntry={openEntryFromList}
                onOpenHighlight={openHighlight}
              />
            )}


        {selectedEntry ? (
          <JournalEntryDetailOverlay entry={selectedEntry} fromCard={entryOrigin === "list"} onClose={closeEntry} onDelete={deleteEntry} />
        ) : null}

        </StaggerItem>
      </Stagger>
    </PauseShell>
  );
}

function JournalEntryDetailOverlay({
  entry,
  fromCard,
  onClose,
  onDelete,
}: {
  entry: TellEntry;
  /** Opened from its card in the story: the sheet grows out of that card. */
  fromCard: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const when = new Date(entry.createdAt);
  // Grows out of its card where view transitions run; otherwise it rises as before.
  const morph = fromCard && viewTransitionsSupported();
  const panel = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Journal entry"
      className={`sheet-panel ${morph ? "sheet-panel--morph " : ""}journal-paper relative max-h-[85dvh] w-full max-w-[30rem] overflow-y-auto rounded-t-[1.75rem] px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3`}
    >
      <span className="mx-auto mb-5 block h-1 w-10 rounded-full" style={{ background: "var(--ds-border)" }} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
            {when.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="ds-caption mt-0.5">
            {entry.source === "speak" ? "Spoken" : "Written"} · {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <button type="button" onClick={onClose} className="ds-tap min-h-11 rounded-full px-3 text-sm font-semibold" style={{ color: "var(--ds-accent)" }}>
          Done
        </button>
      </div>
      <p className="journal-lines mt-4 whitespace-pre-line text-[1.05rem] leading-8">{entry.text}</p>
      {entry.chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {entry.chips.map((chip) => (
            <span key={chip} className="rounded-full px-2.5 py-1 text-[0.78rem] font-medium" style={{ background: "var(--ds-accent-soft)", color: "var(--ds-text-secondary)" }}>
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 border-t pt-4">
        {confirmingDelete ? (
          <div className="flex items-center gap-2.5">
            <p className="flex-1 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
              Delete this entry for good?
            </p>
            <button type="button" onClick={() => setConfirmingDelete(false)} className="ds-tap min-h-11 rounded-full px-4 text-sm font-medium" style={{ color: "var(--ds-text-secondary)" }}>
              Keep
            </button>
            <button
              type="button"
              onClick={() => {
                haptic("success");
                onDelete(entry.id);
              }}
              className="ds-tap min-h-11 rounded-full px-4 text-sm font-semibold"
              style={{ background: "var(--ds-error)", color: "#fff" }}
            >
              Delete
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)} className="ds-tap min-h-11 rounded-full text-sm font-medium" style={{ color: "var(--ds-error)" }}>
            Delete entry
          </button>
        )}
      </div>
    </div>
  );
  // Portalled to <body>: Journey content animates with a transform, which
  // would otherwise trap a fixed overlay inside it.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
      <button type="button" aria-label="Close entry" onClick={onClose} className="sheet-backdrop absolute inset-0 cursor-default" style={{ background: "rgba(15, 23, 42, 0.35)" }} />
      {morph ? (
        <ViewTransition name={vtName("entry", entry.id)} share="expand" default="none">
          {panel}
        </ViewTransition>
      ) : (
        panel
      )}
    </div>,
    document.body,
  );
}

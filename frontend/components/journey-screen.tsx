"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { IconCheck, IconChevronRight, IconFeather } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { JournalComposer, JourneySummary, StoryTimeline, buildStory } from "@/components/journey-story";
import { Stagger, StaggerItem } from "@/components/reveal";
import { haptic } from "@/lib/haptics";
import { hasActivePass, setDevHasPass } from "@/lib/entitlements";
import { computeGrowthStatements, type GrowthStatement } from "@/lib/growth-model";
import { getLinkedJournalEntries, listHighlights, type Highlight } from "@/lib/journey-highlights";
import { listMomentRecords } from "@/lib/moment-storage";
import { listPauseRecords, type PauseRecord } from "@/lib/pause-storage";
import {
  generatePatternCandidates,
  resolvePatternHighlights,
} from "@/lib/pattern-engine";
import {
  listPatterns,
  markPatternsGenerated,
  setPatternStatus,
  shouldRegeneratePatterns,
  upsertGeneratedPattern,
  type PatternRecord,
} from "@/lib/pattern-storage";
import { deleteTellEntry, listTellEntries, type TellEntry } from "@/lib/tell-storage";
import { getPatternAnalysisConsent } from "@/lib/privacy-controls";

type Tab = "story" | "patterns" | "growth";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "story", label: "Your story" },
  { id: "patterns", label: "Patterns" },
  { id: "growth", label: "Growth" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function JourneyScreen() {
  const [tab, setTab] = useState<Tab>("story");
  const [pauses, setPauses] = useState<PauseRecord[]>([]);
  const [momentCount, setMomentCount] = useState(0);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [journalEntries, setJournalEntries] = useState<TellEntry[]>([]);
  const [patterns, setPatterns] = useState<PatternRecord[]>([]);
  const [growthStatements, setGrowthStatements] = useState<GrowthStatement[]>([]);
  const [pass, setPass] = useState(false);

  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TellEntry | null>(null);
  const [entryOrigin, setEntryOrigin] = useState<"list" | "highlight">("list");
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>(null);

  const refresh = () => {
    setHighlights(listHighlights());
    setJournalEntries(listTellEntries());
    setPatterns(listPatterns());
    setPauses(listPauseRecords());
    setMomentCount(listMomentRecords().length);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPass(hasActivePass());
    refresh();
  }, []);

  useEffect(() => {
    if (tab !== "patterns") return;
    const scope = hasActivePass() ? "pass" : "free";
    // You -> Data & Privacy's "used for deeper pattern analysis" control
    // (docs/PRODUCT_FLOW.md §35): declining only stops *new* generation —
    // already-generated patterns stay visible and correctable, same as any
    // other earned history.
    if (getPatternAnalysisConsent() && shouldRegeneratePatterns()) {
      for (const candidate of generatePatternCandidates(scope)) {
        upsertGeneratedPattern({ ...candidate, scope });
      }
      markPatternsGenerated();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPatterns(listPatterns());
  }, [tab]);

  useEffect(() => {
    if (tab !== "growth") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGrowthStatements(computeGrowthStatements(hasActivePass() ? "pass" : "free"));
  }, [tab]);

  const story = buildStory(journalEntries, highlights, pauses);

  const openHighlight = (highlight: Highlight) => {
    setSelectedHighlight(highlight);
    setSelectedEntry(null);
  };
  const openEntryFromList = (entry: TellEntry) => {
    setSelectedEntry(entry);
    setEntryOrigin("list");
  };
  const openEntryFromHighlight = (entry: TellEntry) => {
    setSelectedEntry(entry);
    setEntryOrigin("highlight");
  };
  const closeEntry = () => {
    if (entryOrigin === "highlight") {
      setSelectedEntry(null);
    } else {
      setSelectedEntry(null);
    }
  };
  const deleteEntry = (id: string) => {
    deleteTellEntry(id);
    setSelectedEntry(null);
    refresh();
  };

  const togglePass = () => {
    const next = !pass;
    setDevHasPass(next);
    setPass(next);
  };

  return (
    <PauseShell>
      <Stagger className="space-y-5 pb-4 pt-2">
        <StaggerItem>
          <header>
            <h1 className="ds-display text-[1.85rem]">Journey</h1>
            <p className="mt-1.5 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              Your story, in your own words.
            </p>
          </header>
        </StaggerItem>

        <StaggerItem>
          <JourneySummary pauses={pauses} entries={journalEntries} moments={momentCount} />
        </StaggerItem>

        <StaggerItem>
          <JournalComposer onSaved={refresh} />
        </StaggerItem>

        <StaggerItem className="space-y-5">
          <div role="tablist" aria-label="Journey" className="grid grid-cols-3 gap-1 rounded-full p-1" style={{ background: "var(--ds-accent-soft)" }}>
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => {
                  haptic("tap");
                  setTab(item.id);
                  setSelectedHighlight(null);
                  setSelectedEntry(null);
                }}
                className="ds-tap min-h-11 rounded-full px-2 text-[0.85rem] font-semibold"
                style={{
                  background: tab === item.id ? "var(--ds-surface-raised)" : "transparent",
                  color: tab === item.id ? "var(--ds-text)" : "var(--ds-text-secondary)",
                  boxShadow: tab === item.id ? "var(--ds-elevation-1)" : undefined,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "story" ? (
            selectedHighlight ? (
              <HighlightDetail highlight={selectedHighlight} onBack={() => setSelectedHighlight(null)} onOpenEntry={openEntryFromHighlight} />
            ) : (
              <StoryTimeline items={story} onOpenEntry={openEntryFromList} onOpenHighlight={openHighlight} />
            )
          ) : null}

          {tab === "patterns" ? (
            <PatternsList
              patterns={patterns}
              expandedId={expandedPatternId}
              onToggleExpand={(id) => setExpandedPatternId((current) => (current === id ? null : id))}
              onRespond={(id, status) => {
                haptic("success");
                setPatternStatus(id, status);
                refresh();
              }}
              pass={pass}
            />
          ) : null}

          {tab === "growth" ? <GrowthList statements={growthStatements} pass={pass} /> : null}

        {selectedEntry ? (
          <JournalEntryDetailOverlay entry={selectedEntry} onClose={closeEntry} onDelete={deleteEntry} />
        ) : null}

        {process.env.NODE_ENV === "development" ? (
          <section
            aria-label="Dev: Journey testing"
            className="space-y-2 rounded-[var(--ds-radius-sm)] border border-dashed px-3 py-3 text-xs"
            style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
          >
            <p className="font-semibold">DEV · Journey testing</p>
            <button
              type="button"
              onClick={togglePass}
              className="ds-tap min-h-11 rounded-full border px-3 font-medium"
              style={{ borderColor: "var(--ds-border)" }}
            >
              {pass ? "Pass: ON (tap to turn off)" : "Pass: OFF (tap to turn on)"}
            </button>
          </section>
        ) : null}
        </StaggerItem>
      </Stagger>
    </PauseShell>
  );
}

function HighlightDetail({
  highlight,
  onBack,
  onOpenEntry,
}: {
  highlight: Highlight;
  onBack: () => void;
  onOpenEntry: (entry: TellEntry) => void;
}) {
  const linkedEntries = getLinkedJournalEntries(highlight);
  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="ds-tap -my-3.5 inline-flex min-h-11 items-center gap-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
        style={{ color: "var(--ds-text-secondary)" }}
      >
        <IconChevronRight className="h-3.5 w-3.5" style={{ transform: "scaleX(-1)" }} />
        Highlights
      </button>

      <div className="space-y-3 rounded-[var(--ds-radius-lg)] px-5 py-6" style={{ background: "var(--ds-surface)" }}>
        <div>
          <h1 className="text-[1.25rem] font-semibold leading-tight">{highlight.title}</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            {highlight.timingLabel} · {formatDate(highlight.createdAt)}
          </p>
        </div>

        {highlight.expression ? (
          <blockquote className="border-l-2 pl-3 text-sm italic leading-6" style={{ borderColor: "var(--ds-accent)", color: "var(--ds-text)" }}>
            &ldquo;{highlight.expression}&rdquo;
          </blockquote>
        ) : null}

        {highlight.feedback ? (
          <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            Outcome: <span style={{ color: "var(--ds-text)" }}>{highlight.feedback === "better" ? "Felt better" : highlight.feedback === "same" ? "Felt the same" : "Didn't help much"}</span>
          </p>
        ) : null}

        {highlight.returnToMe ? (
          <div className="rounded-[var(--ds-radius-sm)] border px-3 py-2.5" style={{ borderColor: "var(--ds-border)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--ds-text-muted)" }}>
              Return to Me
            </p>
            {highlight.returnToMe.responseText ? (
              <p className="mt-1 text-sm italic">&ldquo;{highlight.returnToMe.responseText}&rdquo;</p>
            ) : (
              <p className="mt-1 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
                {highlight.returnToMe.status === "dismissed" ? "Dismissed. No response given." : "Not yet responded to."}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {linkedEntries.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ds-text-muted)" }}>
            Linked Journal entries
          </p>
          {linkedEntries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpenEntry(entry)}
              className="ds-tap block w-full rounded-[var(--ds-radius-sm)] border px-3.5 py-3 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              style={{ borderColor: "var(--ds-border)" }}
            >
              {entry.text.length > 90 ? `${entry.text.slice(0, 90)}…` : entry.text}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function JournalEntryDetailOverlay({
  entry,
  onClose,
  onDelete,
}: {
  entry: TellEntry;
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
  // Portalled to <body>: Journey content animates with a transform, which
  // would otherwise trap a fixed overlay inside it.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
      <button type="button" aria-label="Close entry" onClick={onClose} className="sheet-backdrop absolute inset-0 cursor-default" style={{ background: "rgba(15, 23, 42, 0.35)" }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Journal entry"
        className="sheet-panel journal-paper relative max-h-[85dvh] w-full max-w-[30rem] overflow-y-auto rounded-t-[1.75rem] px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3"
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
    </div>,
    document.body,
  );
}

function PatternsList({
  patterns,
  expandedId,
  onToggleExpand,
  onRespond,
  pass,
}: {
  patterns: PatternRecord[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onRespond: (id: string, status: "relevant" | "not-relevant") => void;
  pass: boolean;
}) {
  const router = useRouter();
  const visible = patterns.filter((p) => p.status !== "not-relevant");

  return (
    <div className="space-y-3">
      {visible.length === 0 ? (
        <EmptyNote title="No patterns yet" body="As your story grows, Inner Pause will notice what keeps coming up and ask if it rings true." />
      ) : (
        visible.map((pattern) => {
          const expanded = expandedId === pattern.id;
          const supporting = resolvePatternHighlights(pattern.supportingHighlightIds);
          return (
            <article key={pattern.id} className="ds-card space-y-3 px-5 py-5">
              <p className="ds-label uppercase" style={{ color: "var(--ds-accent-secondary)" }}>
                Something we noticed
              </p>
              <p className="text-[1.02rem] font-medium leading-7">{pattern.text}</p>

              {pattern.supportingHighlightIds.length > 0 || pattern.supportingJournalEntryIds.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onToggleExpand(pattern.id)}
                  aria-expanded={expanded}
                  className="ds-tap inline-flex min-h-11 items-center gap-1 rounded-full text-sm font-medium"
                  style={{ color: "var(--ds-accent)" }}
                >
                  {expanded ? "Hide where this comes from" : "Where this comes from"}
                </button>
              ) : null}

              {expanded ? (
                <ul className="space-y-1 border-l-2 pl-3 text-[0.85rem] leading-6" style={{ borderColor: "var(--ds-accent-soft)", color: "var(--ds-text-secondary)" }}>
                  {supporting.map((item) => (
                    <li key={item.id}>
                      {item.title} · {formatDate(item.createdAt)}
                    </li>
                  ))}
                  {pattern.supportingJournalEntryIds.length > 0 ? <li>{pattern.supportingJournalEntryIds.length} journal entries</li> : null}
                </ul>
              ) : null}

              {pattern.status === "candidate" ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" onClick={() => onRespond(pattern.id, "relevant")} className="ds-chip">
                    That&rsquo;s true
                  </button>
                  <button type="button" onClick={() => onRespond(pattern.id, "not-relevant")} className="ds-chip">
                    Not really
                  </button>
                  <button type="button" onClick={() => router.push("/tell")} className="ds-chip" style={{ color: "var(--ds-accent)", borderColor: "var(--ds-accent)" }}>
                    Tell me more
                  </button>
                </div>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--ds-success)" }}>
                  <IconCheck className="h-4 w-4" />
                  You said this rings true
                </p>
              )}
            </article>
          );
        })
      )}
      {!pass ? <PassNote text="With Inner Pause Pass, patterns look across your whole story, not just recent weeks." /> : null}
    </div>
  );
}

function GrowthList({ statements, pass }: { statements: GrowthStatement[]; pass: boolean }) {
  return (
    <div className="space-y-3">
      {statements.length === 0 ? (
        <EmptyNote title="Growth takes a little time" body="Keep pausing and writing. When something gets easier for you, it will show up here." />
      ) : (
        statements.map((statement) => (
          <article key={statement.id} className="ds-card flex gap-3.5 px-5 py-5">
            <span className="ds-outcome-icon grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ ["--ds-outcome-color" as string]: "var(--ds-outcome-release)" }} aria-hidden="true">
              <IconFeather className="h-[1.1rem] w-[1.1rem]" />
            </span>
            <p className="text-[1rem] leading-7">{statement.text}</p>
          </article>
        ))
      )}
      {!pass ? <PassNote text="With Inner Pause Pass, you can see then and now side by side across your full history." /> : null}
    </div>
  );
}

function EmptyNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="ds-card grid justify-items-center gap-2 px-6 py-8 text-center">
      <p className="ds-h3">{title}</p>
      <p className="max-w-[18rem] text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
        {body}
      </p>
    </div>
  );
}

function PassNote({ text }: { text: string }) {
  return (
    <p className="rounded-[var(--ds-radius-md)] px-4 py-3 text-[0.85rem] leading-6" style={{ background: "var(--ds-accent-soft)", color: "var(--ds-text-secondary)" }}>
      {text}
    </p>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { IconChevronRight } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { hasActivePass, setDevHasPass } from "@/lib/entitlements";
import { computeGrowthStatements, type GrowthStatement } from "@/lib/growth-model";
import { getLinkedJournalEntries, listHighlights, type Highlight } from "@/lib/journey-highlights";
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

type Tab = "highlights" | "journal" | "patterns" | "growth";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "highlights", label: "Highlights" },
  { id: "journal", label: "Journal" },
  { id: "patterns", label: "Patterns" },
  { id: "growth", label: "Growth" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function JourneyScreen() {
  const [tab, setTab] = useState<Tab>("highlights");
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

  const hasAnyHistory = highlights.length > 0 || journalEntries.length > 0;

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
      <div className="space-y-5 pb-4 pt-2">
        <header>
          <h1 className="text-[1.4rem] font-semibold leading-tight tracking-[-0.01em]">Journey</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            Help me understand myself.
          </p>
        </header>

        {!hasAnyHistory ? (
          <section className="space-y-2 rounded-[var(--ds-radius-lg)] px-5 py-8 text-center" style={{ background: "var(--ds-surface)" }}>
            <p className="text-[1.05rem] font-semibold">Your Journey starts here.</p>
            <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
              Your Pauses, moments and reflections will gather here over time.
            </p>
          </section>
        ) : (
          <>
            <div className="inline-flex flex-wrap gap-1 rounded-full p-1" style={{ background: "var(--ds-surface)" }}>
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setSelectedHighlight(null);
                    setSelectedEntry(null);
                  }}
                  aria-pressed={tab === item.id}
                  className="ds-tap inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                  style={{
                    background: tab === item.id ? "var(--ds-accent)" : "transparent",
                    color: tab === item.id ? "var(--ds-accent-on)" : "var(--ds-text-secondary)",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {tab === "highlights" ? (
              selectedHighlight ? (
                <HighlightDetail
                  highlight={selectedHighlight}
                  onBack={() => setSelectedHighlight(null)}
                  onOpenEntry={openEntryFromHighlight}
                />
              ) : (
                <HighlightsList highlights={highlights} onOpen={openHighlight} />
              )
            ) : null}

            {tab === "journal" ? (
              <JournalList entries={journalEntries} onOpen={openEntryFromList} />
            ) : null}

            {tab === "patterns" ? (
              <PatternsList
                patterns={patterns}
                expandedId={expandedPatternId}
                onToggleExpand={(id) => setExpandedPatternId((current) => (current === id ? null : id))}
                onRespond={(id, status) => {
                  setPatternStatus(id, status);
                  refresh();
                }}
                pass={pass}
              />
            ) : null}

            {tab === "growth" ? <GrowthList statements={growthStatements} pass={pass} /> : null}
          </>
        )}

        {selectedEntry ? (
          <JournalEntryDetailOverlay entry={selectedEntry} onClose={closeEntry} onDelete={deleteEntry} />
        ) : null}

        {process.env.NODE_ENV === "development" ? (
          <section
            aria-label="Dev: Journey testing"
            className="space-y-2 rounded-[var(--ds-radius-sm)] border border-dashed px-3 py-3 text-xs"
            style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
          >
            <p className="font-semibold">DEV — Journey testing</p>
            <button
              type="button"
              onClick={togglePass}
              className="ds-tap min-h-9 rounded-full border px-3 font-medium"
              style={{ borderColor: "var(--ds-border)" }}
            >
              {pass ? "Pass: ON (tap to turn off)" : "Pass: OFF (tap to turn on)"}
            </button>
          </section>
        ) : null}
      </div>
    </PauseShell>
  );
}

function HighlightsList({ highlights, onOpen }: { highlights: Highlight[]; onOpen: (h: Highlight) => void }) {
  if (highlights.length === 0) {
    return (
      <p className="pt-4 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
        Meaningful moments from Moments and Practice will appear here.
      </p>
    );
  }
  return (
    <div className="space-y-2.5">
      {highlights.map((highlight) => (
        <button
          key={highlight.id}
          type="button"
          onClick={() => onOpen(highlight)}
          className="ds-tap flex w-full items-center justify-between gap-3 rounded-[var(--ds-radius-md)] px-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          style={{ background: "var(--ds-surface)" }}
        >
          <span className="min-w-0">
            <span className="block text-[0.98rem] font-semibold">{highlight.title}</span>
            <span className="mt-0.5 block text-[0.78rem]" style={{ color: "var(--ds-text-secondary)" }}>
              {highlight.timingLabel} · {formatDate(highlight.createdAt)}
            </span>
          </span>
          <IconChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--ds-text-muted)" }} />
        </button>
      ))}
    </div>
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
        className="ds-tap inline-flex items-center gap-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
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
                {highlight.returnToMe.status === "dismissed" ? "Dismissed — no response given." : "Not yet responded to."}
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

function JournalList({ entries, onOpen }: { entries: TellEntry[]; onOpen: (entry: TellEntry) => void }) {
  if (entries.length === 0) {
    return (
      <p className="pt-4 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
        What you write or say to Inner Pause will appear here.
      </p>
    );
  }
  return (
    <div className="space-y-2.5">
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onOpen(entry)}
          className="ds-tap block w-full rounded-[var(--ds-radius-md)] px-4 py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          style={{ background: "var(--ds-surface)" }}
        >
          <span className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: "var(--ds-text-muted)" }}>
            <span>{entry.source === "speak" ? "Spoken" : "Written"}</span>
            <span>·</span>
            <span>{formatDate(entry.createdAt)}</span>
          </span>
          <span className="mt-1 block text-sm leading-5">{entry.text.length > 120 ? `${entry.text.slice(0, 120)}…` : entry.text}</span>
        </button>
      ))}
    </div>
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
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Journal entry"
        className="w-full max-w-[26rem] space-y-4 rounded-[var(--ds-radius-lg)] p-5"
        style={{ background: "var(--ds-bg)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ds-text-muted)" }}>
            {entry.source === "speak" ? "Spoken" : "Written"} · {formatDate(entry.createdAt)}
          </p>
          <button type="button" onClick={onClose} aria-label="Close" className="ds-tap text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            Close
          </button>
        </div>
        <p className="text-base leading-6">{entry.text}</p>

        {confirmingDelete ? (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              className="ds-tap min-h-11 flex-1 rounded-full text-sm font-semibold"
              style={{ background: "var(--ds-error)", color: "#fff" }}
            >
              Delete permanently
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="ds-tap min-h-11 rounded-full px-4 text-sm font-medium"
              style={{ color: "var(--ds-text-secondary)" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="ds-tap text-sm font-medium"
            style={{ color: "var(--ds-error)" }}
          >
            Delete entry
          </button>
        )}
      </div>
    </div>
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
      {!pass ? (
        <p className="rounded-[var(--ds-radius-sm)] border px-3.5 py-2.5 text-xs" style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}>
          Showing patterns from your recent history. A Pass unlocks longitudinal analysis across your full Journey.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="pt-2 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
          Not enough repeated material yet to show a pattern — keep using Inner Pause and one may appear here.
        </p>
      ) : (
        visible.map((pattern) => {
          const expanded = expandedId === pattern.id;
          const supporting = resolvePatternHighlights(pattern.supportingHighlightIds);
          return (
            <div key={pattern.id} className="space-y-2.5 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
              <p className="text-sm leading-5">{pattern.text}</p>

              {pattern.supportingHighlightIds.length > 0 || pattern.supportingJournalEntryIds.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onToggleExpand(pattern.id)}
                  className="ds-tap text-xs font-medium underline decoration-dotted underline-offset-4"
                  style={{ color: "var(--ds-accent)" }}
                >
                  {expanded ? "Hide supporting entries" : "Show supporting entries"}
                </button>
              ) : null}

              {expanded ? (
                <ul className="space-y-1 text-xs" style={{ color: "var(--ds-text-secondary)" }}>
                  {supporting.map((item) => (
                    <li key={item.id}>
                      {item.title} — {formatDate(item.createdAt)}
                    </li>
                  ))}
                  {pattern.supportingJournalEntryIds.length > 0 ? <li>{pattern.supportingJournalEntryIds.length} Journal entries</li> : null}
                </ul>
              ) : null}

              {pattern.status === "candidate" ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onRespond(pattern.id, "relevant")}
                    className="ds-tap min-h-9 rounded-full border px-3.5 text-xs font-semibold"
                    style={{ borderColor: "var(--ds-border)" }}
                  >
                    Relevant
                  </button>
                  <button
                    type="button"
                    onClick={() => onRespond(pattern.id, "not-relevant")}
                    className="ds-tap min-h-9 rounded-full border px-3.5 text-xs font-semibold"
                    style={{ borderColor: "var(--ds-border)" }}
                  >
                    Not really
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/tell")}
                    className="ds-tap min-h-9 rounded-full border px-3.5 text-xs font-semibold"
                    style={{ borderColor: "var(--ds-accent)", color: "var(--ds-accent)" }}
                  >
                    Tell Pause more
                  </button>
                </div>
              ) : (
                <p className="text-xs font-medium" style={{ color: "var(--ds-accent)" }}>
                  Marked relevant
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function GrowthList({ statements, pass }: { statements: GrowthStatement[]; pass: boolean }) {
  if (statements.length === 0) {
    return (
      <p className="pt-4 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
        Not enough history yet to show meaningful change.
      </p>
    );
  }
  return (
    <div className="space-y-2.5">
      {statements.map((statement) => (
        <div key={statement.id} className="rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
          <p className="text-sm leading-5">{statement.text}</p>
        </div>
      ))}
      {!pass ? (
        <p className="rounded-[var(--ds-radius-sm)] border px-3.5 py-2.5 text-xs" style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}>
          A Pass unlocks a then-vs-now comparison across your full history.
        </p>
      ) : null}
    </div>
  );
}

import { getCoreArc } from "@/lib/practice-content";
import { practiceSkillMap } from "@/lib/practice-skills";
import { listMomentRecords, type MomentRecord, type ReturnToMeState } from "@/lib/moment-storage";
import { getPauseRecord, type PauseFeedback } from "@/lib/pause-storage";
import { listPracticeSessionRecords, type PracticeSessionRecord } from "@/lib/practice-storage";
import { listTellEntries, type TellEntry } from "@/lib/tell-storage";

// Journey — Highlights (this slice's brief §2): a pure read/model layer,
// never a separate store. Every MomentRecord already represents "something
// meaningful happened" — lib/moment-storage.ts only ever creates one when a
// specific situation or a real expression was given (never from mode
// selection alone), so every Moment is Highlight-worthy by construction; no
// extra filtering needed there. Practice sessions are Practice-only
// mechanics by default (docs/PRODUCT_FLOW.md §37) — a session is promoted
// to a Highlight only when it carried both a real-world rep *and* the user
// actually reported back on it (activityRealWorldRep + returnText), the
// deterministic stand-in for "a real-world event became meaningful" without
// calling AI to judge significance.
export type HighlightSourceType = "moment" | "practice";

export interface Highlight {
  id: string;
  sourceType: HighlightSourceType;
  sourceId: string;
  title: string;
  timingLabel: string;
  createdAt: string;
  linkedPauseRecordId?: string;
  expression?: string;
  feedback?: PauseFeedback;
  returnToMe?: ReturnToMeState;
}

const MODE_TIMING_LABEL: Record<MomentRecord["mode"], string> = {
  before: "Before",
  during: "During",
  after: "After",
};

function highlightFromMoment(record: MomentRecord): Highlight {
  // MomentRecord.feedback is never actually written anywhere in the current
  // Moments flow — the Pause Player's own Better/Same/Not-better answer is
  // only ever recorded on the PauseRecord it belongs to. Rather than wiring
  // a write-time sync into the Moments/Core Pause slices (out of scope to
  // touch here), resolve it at Journey's read layer instead: the Moment's
  // own field wins if some future path ever sets it directly, otherwise
  // fall back to the linked Pause's recorded feedback.
  const linkedPause = record.linkedPauseRecordId ? getPauseRecord(record.linkedPauseRecordId) : undefined;
  return {
    id: `moment:${record.id}`,
    sourceType: "moment",
    sourceId: record.id,
    title: record.situationLabel ?? MODE_TIMING_LABEL[record.mode],
    timingLabel: MODE_TIMING_LABEL[record.mode],
    createdAt: record.createdAt,
    linkedPauseRecordId: record.linkedPauseRecordId,
    expression: record.expression,
    feedback: record.feedback ?? linkedPause?.feedback,
    returnToMe: record.returnToMe.status === "not-applicable" ? undefined : record.returnToMe,
  };
}

function highlightFromPractice(record: PracticeSessionRecord): Highlight | null {
  if (!record.activityRealWorldRep || !record.returnText) return null;
  const skill = practiceSkillMap[record.skillId];
  return {
    id: `practice:${record.id}`,
    sourceType: "practice",
    sourceId: record.id,
    title: `${skill.label} — ${record.activityRealWorldRep}`,
    timingLabel: "Practice",
    createdAt: record.completedAt ?? record.startedAt,
    linkedPauseRecordId: record.linkedPauseRecordId,
    expression: record.returnText,
    feedback: record.pauseFeedback,
  };
}

export function listHighlights(): Highlight[] {
  const fromMoments = listMomentRecords().map(highlightFromMoment);
  const fromPractice = listPracticeSessionRecords()
    .map(highlightFromPractice)
    .filter((item): item is Highlight => item !== null);
  return [...fromMoments, ...fromPractice].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getHighlight(sourceType: HighlightSourceType, sourceId: string): Highlight | null {
  if (sourceType === "moment") {
    const record = listMomentRecords().find((item) => item.id === sourceId);
    return record ? highlightFromMoment(record) : null;
  }
  const record = listPracticeSessionRecords().find((item) => item.id === sourceId);
  return record ? highlightFromPractice(record) : null;
}

// Linked Journal material for a Highlight (this slice's brief §4: "A
// Highlight may contain linked Journal entries") — resolved at read time
// via the existing linkedMomentId/linkedPracticeSessionId fields, never a
// duplicate copy of the text.
export function getLinkedJournalEntries(highlight: Highlight): TellEntry[] {
  const all = listTellEntries();
  if (highlight.sourceType === "moment") {
    return all.filter((entry) => entry.linkedMomentId === highlight.sourceId);
  }
  return all.filter((entry) => entry.linkedPracticeSessionId === highlight.sourceId);
}

// Used by lib/practice-content.ts consumers to label a Highlight's session
// context without re-importing the whole content module elsewhere.
export function describePracticeSession(skillId: PracticeSessionRecord["skillId"], sessionNumber: number): string {
  const arc = getCoreArc(skillId);
  return arc[sessionNumber - 1]?.title ?? `Session ${sessionNumber}`;
}

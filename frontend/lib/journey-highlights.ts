import { listMomentRecords, type MomentRecord, type ReturnToMeState } from "@/lib/moment-storage";
import { getPauseRecord, type PauseFeedback } from "@/lib/pause-storage";
import { findProgramme } from "@/lib/programme-data";
import { readProgrammeState, type ProgrammeCheckIn, type ProgrammeEnrollment } from "@/lib/programme-storage";
import { listTellEntries, type TellEntry } from "@/lib/tell-storage";

// Journey — Highlights (this slice's brief §2): a pure read/model layer,
// never a separate store. Every MomentRecord already represents "something
// meaningful happened" — lib/moment-storage.ts only ever creates one when a
// specific situation or a real expression was given (never from mode
// selection alone), so every Moment is Highlight-worthy by construction; no
// extra filtering needed there. Practice days are Practice-only mechanics
// by default (docs/PRODUCT_FLOW.md §37): a day of one of the five paths is
// promoted to a Highlight only when you wrote a check-in for it, the
// deterministic stand-in for "this became meaningful" without calling AI
// to judge significance.
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

// A path day's id, kept free of ":" (Highlight ids are "<type>:<sourceId>").
const practiceSourceId = (enrollment: ProgrammeEnrollment, day: number) => `${enrollment.id}~${day}`;

function highlightFromCheckIn(enrollment: ProgrammeEnrollment, checkIn: ProgrammeCheckIn): Highlight | null {
  if (!checkIn.text.trim()) return null;
  const path = findProgramme(enrollment.issueId);
  if (!path) return null;
  const dayTitle = path.days[checkIn.day - 1]?.title;
  const sourceId = practiceSourceId(enrollment, checkIn.day);
  return {
    id: `practice:${sourceId}`,
    sourceType: "practice",
    sourceId,
    title: dayTitle ? `${path.title} · Day ${checkIn.day}, ${dayTitle}` : `${path.title} · Day ${checkIn.day}`,
    timingLabel: "Practice",
    createdAt: checkIn.createdAt,
    expression: checkIn.text,
  };
}

function practiceHighlights(): Highlight[] {
  return readProgrammeState().enrollments.flatMap((enrollment) =>
    enrollment.checkIns.map((checkIn) => highlightFromCheckIn(enrollment, checkIn)).filter((item): item is Highlight => item !== null),
  );
}

export function listHighlights(): Highlight[] {
  const fromMoments = listMomentRecords().map(highlightFromMoment);
  return [...fromMoments, ...practiceHighlights()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getHighlight(sourceType: HighlightSourceType, sourceId: string): Highlight | null {
  if (sourceType === "moment") {
    const record = listMomentRecords().find((item) => item.id === sourceId);
    return record ? highlightFromMoment(record) : null;
  }
  return practiceHighlights().find((item) => item.sourceId === sourceId) ?? null;
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

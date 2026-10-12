"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { IconMic, IconPencil } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { getCoreArc } from "@/lib/practice-content";
import {
  composePracticeSessionPause,
  getCheckInContent,
  getCheckpointTier,
  hasEarnedCoreArcMilestone,
  resolvePracticeSession,
  type ResolvedPracticeSession,
} from "@/lib/practice-engine";
import { canStartNewPracticeSession } from "@/lib/practice-entitlement";
import { getMilestoneProgress } from "@/lib/practice-milestones";
import { createPauseRecord, getPauseRecord } from "@/lib/pause-storage";
import { type PracticeSkillId, practiceSkillMap } from "@/lib/practice-skills";
import {
  createPracticeCheckIn,
  createPracticeSessionRecord,
  ensureEnrollment,
  getPracticeSessionRecord,
  listPracticeSessionRecords,
  updateEnrollment,
  updatePracticeSessionRecord,
  type PracticeSessionRecord,
} from "@/lib/practice-storage";
import { createTellEntry, NOT_ROUTED_INTERPRETATION } from "@/lib/tell-storage";
import { useVoiceTranscription } from "@/lib/use-voice-transcription";
import type { CheckInTier } from "@/lib/practice-content";

type ScreenPhase = "loading" | "arrival" | "tell" | "activity" | "return" | "checkin" | "complete" | "pass-continuation" | "not-found";

export function PracticeSessionScreen({ skillId }: { skillId: PracticeSkillId }) {
  const router = useRouter();
  const resumeId = useSearchParams().get("resume");
  const skill = practiceSkillMap[skillId];

  const [phase, setPhase] = useState<ScreenPhase>("loading");
  const [record, setRecord] = useState<PracticeSessionRecord | null>(null);
  const [resolved, setResolved] = useState<ResolvedPracticeSession | null>(null);
  const [checkpointTier, setCheckpointTier] = useState<CheckInTier | null>(null);
  const [arcJustCompleted, setArcJustCompleted] = useState(false);
  const [milestoneJustReached, setMilestoneJustReached] = useState<string | null>(null);

  const [mode, setMode] = useState<"write" | "speak">("write");
  const [writeText, setWriteText] = useState("");
  const voice = useVoiceTranscription();
  const currentText = mode === "speak" ? voice.transcript : writeText;

  const [activityText, setActivityText] = useState("");
  const [checkInText, setCheckInText] = useState("");

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (resumeId) {
      const existing = getPracticeSessionRecord(resumeId);
      const resolvedSession = existing ? resolvePracticeSession(skillId, existing.sessionNumber) : null;
      if (!existing || !resolvedSession) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPhase("not-found");
        return;
      }
      const pauseRecord = existing.linkedPauseRecordId ? getPauseRecord(existing.linkedPauseRecordId) : undefined;
      const withFeedback =
        pauseRecord?.feedback && pauseRecord.feedback !== existing.pauseFeedback
          ? updatePracticeSessionRecord(existing.id, { pauseFeedback: pauseRecord.feedback }) ?? existing
          : existing;
      setRecord(withFeedback);
      setResolved(resolvedSession);
      setPhase("activity");
      return;
    }

    // Free/Pass gate (docs/PRODUCT_FLOW.md §36): checked here, at the actual
    // point of starting a *new* session — resuming an already-started
    // session above never hits this, only starting session 3+ does.
    if (!canStartNewPracticeSession(skillId)) {
      setPhase("pass-continuation");
      return;
    }

    const enrollment = ensureEnrollment(skillId);
    const resolvedSession = resolvePracticeSession(skillId, enrollment.currentSessionNumber);
    if (!resolvedSession) {
      setPhase("not-found");
      return;
    }
    const created = createPracticeSessionRecord(skillId, enrollment.currentSessionNumber);
    setRecord(created);
    setResolved(resolvedSession);
    setPhase("arrival");
  }, [resumeId, skillId]);

  const startPause = () => {
    if (!record || !resolved) return;
    const returnTo = `/practice/${skillId}/session?resume=${record.id}`;
    const definition = composePracticeSessionPause(skillId, resolved, returnTo);
    const pauseRecord = createPauseRecord(definition);
    updatePracticeSessionRecord(record.id, { linkedPauseRecordId: pauseRecord.id });
    router.push(`/pause/player?session=${pauseRecord.id}`);
  };

  const submitTell = () => {
    if (!record) return;
    const trimmed = currentText.trim();
    voice.stop();
    if (trimmed) {
      updatePracticeSessionRecord(record.id, { tellText: trimmed });
      createTellEntry({ text: trimmed, source: mode, chips: [], interpretation: NOT_ROUTED_INTERPRETATION, linkedPracticeSessionId: record.id });
    }
    startPause();
  };

  const submitActivity = () => {
    if (!record || !resolved) return;
    updatePracticeSessionRecord(record.id, {
      activityResponse: activityText.trim() || undefined,
      activityRealWorldRep: resolved.activity.realWorldRep,
    });
    setMode("write");
    setWriteText("");
    voice.cancel();
    setPhase("return");
  };

  const finishSession = (returnText?: string, skipped = false) => {
    if (!record || !resolved) return;
    voice.stop();
    const trimmed = returnText?.trim();
    const updated =
      updatePracticeSessionRecord(record.id, {
        returnText: trimmed || undefined,
        returnSkipped: skipped,
        completedAt: new Date().toISOString(),
      }) ?? record;
    if (trimmed) {
      createTellEntry({ text: trimmed, source: mode, chips: [], interpretation: NOT_ROUTED_INTERPRETATION, linkedPracticeSessionId: record.id });
    }

    const enrollment = ensureEnrollment(skillId);
    const arcLength = getCoreArc(skillId).length;
    const nextSessionNumber = resolved.sessionNumber + 1;
    const completedSessionNumbers = enrollment.completedSessionNumbers.includes(resolved.sessionNumber)
      ? enrollment.completedSessionNumbers
      : [...enrollment.completedSessionNumbers, resolved.sessionNumber];

    const recordsBefore = listPracticeSessionRecords(skillId).filter((item) => item.id !== updated.id);
    const recordsAfter = [...recordsBefore, updated];
    const wasArcEarned = hasEarnedCoreArcMilestone(skillId, recordsBefore);
    const nowArcEarned = hasEarnedCoreArcMilestone(skillId, recordsAfter);
    const justCompletedArc = !wasArcEarned && nowArcEarned;

    // Milestone path (docs/PRODUCT_FLOW.md §4/§14): a quiet recognition
    // moment whenever a new stage is reached, distinct from — and less of a
    // beat than — the Core Arc -> Ongoing Practice transition itself.
    const before = getMilestoneProgress(skillId, recordsBefore, wasArcEarned);
    const after = getMilestoneProgress(skillId, recordsAfter, nowArcEarned);
    const newlyReached = after.reachedCount > before.reachedCount ? after.path[after.reachedCount - 1] : null;

    updateEnrollment(skillId, {
      currentSessionNumber: nextSessionNumber,
      completedSessionNumbers,
      phase: nextSessionNumber > arcLength ? "ongoing" : "core-arc",
      milestoneEarnedAt: justCompletedArc ? new Date().toISOString() : enrollment.milestoneEarnedAt,
    });
    setArcJustCompleted(justCompletedArc);
    setMilestoneJustReached(!justCompletedArc && newlyReached ? newlyReached.title : null);

    const tier = getCheckpointTier(resolved.sessionNumber);
    if (tier) {
      setCheckpointTier(tier);
      setPhase("checkin");
    } else {
      setPhase("complete");
    }
  };

  const submitCheckIn = (response?: string, skipped = false) => {
    if (!resolved || !checkpointTier) return;
    createPracticeCheckIn({ skillId, tier: checkpointTier, atSessionNumber: resolved.sessionNumber, response, skipped });
    if (checkpointTier === "early-signal" && response) {
      updateEnrollment(skillId, { preferredSupport: response });
    }
    setPhase("complete");
  };

  if (phase === "loading") {
    return (
      <PauseShell>
        <p className="pt-8 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
          Preparing your session…
        </p>
      </PauseShell>
    );
  }

  if (phase === "not-found") {
    return (
      <PauseShell>
        <div className="space-y-4 pt-8 text-center">
          <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            We couldn&rsquo;t find that Practice session.
          </p>
          <Link
            href={`/practice/${skillId}`}
            className="ds-tap inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
          >
            Back to {skill.label}
          </Link>
        </div>
      </PauseShell>
    );
  }

  // Reached before `resolved` is ever set (docs/PRODUCT_FLOW.md §36) — must
  // be handled here, not inside the `!resolved` guard below, or it would
  // silently render nothing.
  if (phase === "pass-continuation") {
    return (
      <PauseShell>
        <div className="space-y-4 rounded-[var(--ds-radius-lg)] px-5 py-8 text-center" style={{ background: "var(--ds-surface)" }}>
          <p className="text-[1.1rem] font-semibold">Ready to keep building?</p>
          <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            You&rsquo;ve completed the free preview of the real Practice method. Inner Pause Pass unlocks the rest of{" "}
            {skill.label}, all seven skills, and Ongoing Practice.
          </p>
          <Link
            href="/profile/pass"
            className="ds-tap mt-2 inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
            style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
          >
            Continue with Inner Pause Pass
          </Link>
          <Link
            href={`/practice/${skillId}`}
            className="ds-tap block text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            Back to {skill.label}
          </Link>
        </div>
      </PauseShell>
    );
  }

  if (!resolved) return null;

  return (
    <PauseShell>
      <div className="space-y-5 pb-4 pt-2">
        <header>
          <p className="text-xs font-semibold" style={{ color: "var(--ds-accent)" }}>
            {skill.label}
          </p>
          <p className="mt-0.5 text-[0.7rem]" style={{ color: "var(--ds-text-muted)" }}>
            Session {resolved.sessionNumber}
          </p>
        </header>

        {phase === "arrival" ? (
          <section className="grid place-items-center gap-6 py-6 text-center">
            <HarmonyFormVisual playing={false} className="w-[min(52vw,15rem)]" />
            <div className="space-y-1.5">
              {resolved.arrivalGuidance.map((line, index) => (
                <p key={index} className="text-base font-medium">
                  {line}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPhase("tell")}
              className="ds-tap min-h-11 rounded-full px-7 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
              style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
            >
              I&rsquo;m ready
            </button>
          </section>
        ) : null}

        {phase === "tell" ? (
          <section className="space-y-4">
            <div>
              <h1 className="text-[1.25rem] font-semibold leading-tight">How have things been?</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
                Optional — write or speak freely, or skip straight to your Pause.
              </p>
            </div>

            <div className="inline-flex rounded-full p-1" style={{ background: "var(--ds-surface)" }}>
              {(["write", "speak"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  aria-pressed={mode === item}
                  className="ds-tap inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                  style={{
                    background: mode === item ? "var(--ds-accent)" : "transparent",
                    color: mode === item ? "var(--ds-accent-on)" : "var(--ds-text-secondary)",
                  }}
                >
                  {item === "write" ? <IconPencil className="h-4 w-4" /> : <IconMic className="h-4 w-4" />}
                  {item === "write" ? "Write" : "Speak"}
                </button>
              ))}
            </div>

            {mode === "speak" ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={voice.status === "listening" ? voice.stop : voice.start}
                  aria-pressed={voice.status === "listening"}
                  className="ds-tap min-h-11 rounded-full border px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                  style={{ borderColor: "var(--ds-accent)", color: "var(--ds-accent)" }}
                >
                  {voice.status === "listening" ? "Listening… tap to stop" : "Tap to speak"}
                </button>
                {voice.error ? (
                  <p className="text-xs" style={{ color: "var(--ds-error)" }}>
                    {voice.error}
                  </p>
                ) : null}
              </div>
            ) : null}

            <textarea
              value={currentText}
              onChange={(event) => (mode === "speak" ? voice.setTranscript(event.target.value) : setWriteText(event.target.value))}
              placeholder="Optional — how have things been?"
              rows={4}
              className="w-full resize-none rounded-[var(--ds-radius-md)] border bg-transparent p-4 text-base leading-6 outline-none placeholder:text-[var(--ds-text-muted)]"
              style={{ borderColor: "var(--ds-border)", background: "var(--ds-surface)", color: "var(--ds-text)" }}
            />

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={startPause}
                className="text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ color: "var(--ds-text-secondary)" }}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={submitTell}
                className="ds-tap min-h-11 rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
                style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
              >
                Continue
              </button>
            </div>
          </section>
        ) : null}

        {phase === "activity" ? (
          <section className="space-y-4">
            <div className="space-y-2 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ds-text-muted)" }}>
                {resolved.title}
              </p>
              <p className="text-[1.02rem] leading-6">{resolved.activity.prompt}</p>
              {resolved.activity.realWorldRep ? (
                <p className="mt-2 rounded-[var(--ds-radius-sm)] border px-3 py-2.5 text-sm" style={{ borderColor: "var(--ds-accent)", color: "var(--ds-accent)" }}>
                  {resolved.activity.realWorldRep}
                </p>
              ) : null}
            </div>

            <textarea
              value={activityText}
              onChange={(event) => setActivityText(event.target.value)}
              placeholder="Your response — however much or little feels right."
              rows={5}
              autoFocus
              className="w-full resize-none rounded-[var(--ds-radius-md)] border bg-transparent p-4 text-base leading-6 outline-none placeholder:text-[var(--ds-text-muted)]"
              style={{ borderColor: "var(--ds-border)", background: "var(--ds-surface)", color: "var(--ds-text)" }}
            />

            <button
              type="button"
              onClick={submitActivity}
              className="ds-tap min-h-12 w-full rounded-full text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
              style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
            >
              Complete
            </button>
          </section>
        ) : null}

        {phase === "return" ? (
          <section className="space-y-4">
            <h1 className="text-[1.25rem] font-semibold leading-tight">How did that go?</h1>
            <textarea
              value={currentText}
              onChange={(event) => (mode === "speak" ? voice.setTranscript(event.target.value) : setWriteText(event.target.value))}
              placeholder="Optional — write or speak."
              rows={4}
              className="w-full resize-none rounded-[var(--ds-radius-md)] border bg-transparent p-4 text-base leading-6 outline-none placeholder:text-[var(--ds-text-muted)]"
              style={{ borderColor: "var(--ds-border)", background: "var(--ds-surface)", color: "var(--ds-text)" }}
            />
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => finishSession(undefined, true)}
                className="text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ color: "var(--ds-text-secondary)" }}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => finishSession(currentText)}
                className="ds-tap min-h-11 rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
                style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
              >
                Save
              </button>
            </div>
          </section>
        ) : null}

        {phase === "checkin" && checkpointTier ? (
          <section className="space-y-4">
            <h1 className="text-[1.15rem] font-semibold leading-tight">{getCheckInContent(checkpointTier).prompt}</h1>
            {getCheckInContent(checkpointTier).options ? (
              <div className="flex flex-wrap gap-2">
                {getCheckInContent(checkpointTier).options!.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => submitCheckIn(option)}
                    className="ds-tap min-h-11 rounded-full border px-4 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                    style={{ borderColor: "var(--ds-border)", background: "var(--ds-surface)" }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={checkInText}
                onChange={(event) => setCheckInText(event.target.value)}
                placeholder="Optional"
                rows={3}
                className="w-full resize-none rounded-[var(--ds-radius-md)] border bg-transparent p-4 text-base leading-6 outline-none placeholder:text-[var(--ds-text-muted)]"
                style={{ borderColor: "var(--ds-border)", background: "var(--ds-surface)", color: "var(--ds-text)" }}
              />
            )}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => submitCheckIn(undefined, true)}
                className="text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ color: "var(--ds-text-secondary)" }}
              >
                Skip
              </button>
              {!getCheckInContent(checkpointTier).options ? (
                <button
                  type="button"
                  onClick={() => submitCheckIn(checkInText || undefined)}
                  className="ds-tap min-h-11 rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
                  style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
                >
                  Continue
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {phase === "complete" ? (
          <section className="space-y-4 rounded-[var(--ds-radius-lg)] px-5 py-8 text-center" style={{ background: "var(--ds-surface)" }}>
            {arcJustCompleted ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ds-accent)" }}>
                  Foundation built
                </p>
                <p className="text-[1.1rem] font-semibold">You built your foundation.</p>
                <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
                  That&rsquo;s real, demonstrated practice, not just {getCoreArc(skillId).length} sessions checked off. Keep
                  practicing: Ongoing {skill.label} continues from here, drawing on what you&rsquo;ve already built.
                </p>
              </>
            ) : milestoneJustReached ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ds-accent)" }}>
                  Milestone
                </p>
                <p className="text-[1.1rem] font-semibold">{milestoneJustReached}</p>
                <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
                  You&rsquo;re becoming better at this.
                </p>
              </>
            ) : (
              <p className="text-[1.05rem] font-medium">Session complete.</p>
            )}
            <Link
              href={`/practice/${skillId}`}
              className="ds-tap mt-2 inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
              style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
            >
              Back to {skill.label}
            </Link>
          </section>
        ) : null}
      </div>
    </PauseShell>
  );
}

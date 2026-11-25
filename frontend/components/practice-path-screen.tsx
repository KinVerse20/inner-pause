"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { IconCheck, IconChevronRight } from "@/components/pause-icons";
import { PathScene } from "@/components/path-scene";
import { DayAnatomy, DayPeek } from "@/components/path-preview";
import { PathTrail } from "@/components/path-trail";
import { chakraIdFromName, findChakra } from "@/lib/chakra-guide";
import { PauseShell } from "@/components/pause-shell";
import { haptic } from "@/lib/haptics";
import { composeRightNowPause } from "@/lib/pause-engine";
import { createPauseRecord, getPauseRecord } from "@/lib/pause-storage";
import { PATH_LENGTH_DAYS, PATH_PRESENTATION } from "@/lib/practice-path-presentation";
import { findProgramme, type Programme, type ProgrammeId } from "@/lib/programme-data";
import { disableProgrammeReminder, enableProgrammeReminder, notificationSupport } from "@/lib/programme-notifications";
import {
  currentProgrammeDay,
  longestProgrammeStreak,
  programmeStreak,
  readProgrammeState,
  writeProgrammeState,
  type ProgrammeEnrollment,
  type ProgrammeState,
} from "@/lib/programme-storage";

// One Practice path (Kinverse's 14-day programme, our design system).
// The working is Kinverse's: start with a daily reminder time, then each
// day check in → exercise → one real-world action → a sound Pause →
// completion. Rhythm (streak) is shown gently and never as a failure.
type Stage = "overview" | "dashboard" | "checkin" | "day" | "complete";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `p-${Date.now()}`;
}

function latestEnrollment(state: ProgrammeState, id: ProgrammeId) {
  return state.enrollments.filter((item) => item.issueId === id).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}

function completeDay(state: ProgrammeState, enrollmentId: string, day: number): ProgrammeState {
  return {
    ...state,
    enrollments: state.enrollments.map((enrollment) => {
      if (enrollment.id !== enrollmentId) return enrollment;
      const completions = [
        ...enrollment.completions.filter((item) => item.day !== day),
        { day, completedAt: new Date().toISOString() },
      ].sort((a, b) => a.day - b.day);
      return {
        ...enrollment,
        completions,
        pendingPause: undefined,
        status: completions.length >= PATH_LENGTH_DAYS ? ("completed" as const) : ("active" as const),
      };
    }),
  };
}

export function PracticePathScreen({ pathId }: { pathId: string }) {
  const router = useRouter();
  const path = findProgramme(pathId);
  const [state, setState] = useState<ProgrammeState>({ enrollments: [] });
  const [stage, setStage] = useState<Stage>("overview");
  const [loaded, setLoaded] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  // The day open in the preview trail, before starting.
  const [previewDay, setPreviewDay] = useState(1);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [exercise, setExercise] = useState("");
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(3);

  // Read local state after mount; if the day's Pause has finished since we
  // left, that day is complete — whatever the check-in answer was.
  // Survives React's development double-run of effects, so the completion
  // screen still shows after the first run already recorded the day.
  const justCompletedRef = useRef(false);
  useEffect(() => {
    if (!path) return;
    let next = readProgrammeState();
    let nextStage: Stage = justCompletedRef.current ? "complete" : "overview";
    const enrollment = latestEnrollment(next, path.id);
    if (enrollment?.pendingPause) {
      const record = getPauseRecord(enrollment.pendingPause.pauseRecordId);
      if (record?.completedAt) {
        next = completeDay(next, enrollment.id, enrollment.pendingPause.day);
        writeProgrammeState(next);
        // The last day: nothing left to remind you of.
        if (latestEnrollment(next, path.id)?.status === "completed") void disableProgrammeReminder();
        justCompletedRef.current = true;
        haptic("success");
        nextStage = "complete";
      }
    }
    if (nextStage === "overview" && enrollment) nextStage = "dashboard";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(next);
    setStage(nextStage);
    setLoaded(true);
  }, [path]);

  if (!path) return null;
  const { tone, Icon, category } = PATH_PRESENTATION[path.id];
  const chakraId = chakraIdFromName(path.chakra);
  const enrollment = latestEnrollment(state, path.id);
  const dayNumber = enrollment ? currentProgrammeDay(enrollment) : 1;
  const day = path.days[dayNumber - 1];
  const savedCheckIn = enrollment?.checkIns.find((item) => item.day === dayNumber);

  const go = (next: Stage) => {
    haptic("tap");
    setStage(next);
    window.scrollTo({ top: 0 });
  };

  // Today's card and today's stop on the trail both begin here.
  const beginToday = () => {
    setCheckIn(savedCheckIn?.text ?? "");
    setExercise(savedCheckIn?.exerciseResponse ?? "");
    setRating(savedCheckIn?.rating ?? 3);
    go("checkin");
  };

  const save = (next: ProgrammeState) => {
    writeProgrammeState(next);
    setState(next);
  };

  const startPath = async () => {
    if (busy) return;
    haptic("tap");
    setBusy(true);
    setNotice("");
    let permission: NotificationPermission | "unsupported" = notificationSupport() ? Notification.permission : "unsupported";
    // On only when a reminder will actually arrive: connected, or waiting
    // for sign-in. Allowed notifications alone aren't enough.
    let reminderOn = false;
    try {
      const result = await enableProgrammeReminder({ pathId: path.id, reminderTime });
      permission = result.permission;
      reminderOn = result.pushReady || Boolean(result.waitingForSignIn);
      setNotice(result.message);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your path is saved. The reminder could not be connected.");
    }
    const created: ProgrammeEnrollment = {
      id: newId(),
      issueId: path.id,
      startedAt: new Date().toISOString(),
      reminderTime,
      reminderEnabled: reminderOn,
      notificationPermission: permission,
      checkIns: [],
      completions: [],
      status: "active",
    };
    save({ enrollments: [created, ...state.enrollments], activeEnrollmentId: created.id });
    haptic("success");
    setBusy(false);
    setStage("dashboard");
  };

  const saveCheckIn = () => {
    if (!enrollment) return;
    haptic("success");
    save({
      ...state,
      enrollments: state.enrollments.map((item) =>
        item.id === enrollment.id
          ? {
              ...item,
              checkIns: [
                ...item.checkIns.filter((entry) => entry.day !== dayNumber),
                { day: dayNumber, text: checkIn.trim(), exerciseResponse: exercise.trim(), rating, createdAt: new Date().toISOString() },
              ],
            }
          : item,
      ),
    });
    go("day");
  };

  const startDayPause = () => {
    if (!enrollment || !day || busy) return;
    haptic("moment");
    setBusy(true);
    const base = composeRightNowPause(category);
    const record = createPauseRecord({
      ...base,
      pauseType: "practice",
      title: `${path.title} · Day ${dayNumber}`,
      intentLabel: day.intention,
      durationSeconds: day.minutes * 60,
      requiresArrive: true,
      arrivalGuidance: [day.title, "Let your body settle. Then begin."],
      returnTo: `/practice/${path.id}`,
    });
    save({
      ...state,
      activeEnrollmentId: enrollment.id,
      enrollments: state.enrollments.map((item) =>
        item.id === enrollment.id ? { ...item, pendingPause: { day: dayNumber, pauseRecordId: record.id } } : item,
      ),
    });
    router.push(`/pause/player?session=${record.id}`);
  };

  const restart = () => {
    setReminderTime(enrollment?.reminderTime ?? "20:00");
    // The completed run stays in history; starting again adds a new one.
    go("overview");
  };

  const tint = `color-mix(in srgb, var(--ds-outcome-${tone}) 13%, var(--ds-surface))`;
  const back = stage === "checkin" ? () => go("dashboard") : stage === "day" ? () => go("checkin") : null;

  return (
    <PauseShell>
      <div key={stage} className="ds-settle space-y-6 pb-4 pt-2">
        <header className="flex items-center justify-between gap-2">
          {back ? (
            <button type="button" onClick={back} aria-label="Back" className="ds-icon-btn" style={backStyle}>
              <IconChevronRight className="h-4 w-4" style={{ transform: "scaleX(-1)" }} />
            </button>
          ) : (
            <Link href="/practice" aria-label="Back to Practice" className="ds-icon-btn" style={backStyle}>
              <IconChevronRight className="h-4 w-4" style={{ transform: "scaleX(-1)" }} />
            </Link>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: tint }}>
            <Icon className="h-3.5 w-3.5" />
            <span className="ds-label">{path.title}</span>
          </span>
        </header>

        {!loaded ? null : stage === "overview" ? (
          <>
            {/* The whole path before you start: where it goes, what a day holds. */}
            <span className="relative block h-36 overflow-hidden rounded-[var(--ds-radius-lg)]" aria-hidden="true">
              <PathScene pathId={path.id} className="absolute inset-0 h-full w-full" />
            </span>
            <div>
              <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
                A 14-day path
              </p>
              <h1 className="ds-display mt-2 text-[1.85rem]">{path.title}</h1>
              <p className="mt-2 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                {path.description}
              </p>
              {chakraId ? (
                <Link
                  href={`/chakras/${chakraId}`}
                  className="ds-tap mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[0.8rem] font-medium"
                  style={{ background: tint }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: findChakra(chakraId)?.color }} aria-hidden="true" />
                  Inspired by the {findChakra(chakraId)?.name} · {path.frequencyHz} Hz
                  <IconChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>

            <section aria-labelledby="preview-title" className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 id="preview-title" className="ds-h3">
                  Your 14 days
                </h2>
                <span className="ds-caption">Swipe, and tap a day to look ahead</span>
              </div>
              <div className="overflow-hidden rounded-[var(--ds-radius-lg)] px-2 py-3" style={{ background: `color-mix(in srgb, var(--ds-outcome-${tone}) 7%, var(--ds-surface))` }}>
                <PathTrail
                  path={path}
                  enrollment={null}
                  today={null}
                  tone={tone}
                  onBeginToday={() => {}}
                  preview={{
                    selected: previewDay,
                    onSelect: (selectedDay) => {
                      setPreviewDay(selectedDay);
                      // The day's card sits under the trail: bring it into view if it isn't.
                      window.requestAnimationFrame(() =>
                        document.getElementById("day-peek")?.scrollIntoView({
                          block: "nearest",
                          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                        }),
                      );
                    },
                  }}
                />
              </div>
              <div id="day-peek" className="scroll-mb-28">{path.days[previewDay - 1] ? <DayPeek day={path.days[previewDay - 1]} tone={tone} total={path.days.length} /> : null}</div>
            </section>

            <DayAnatomy path={path} tone={tone} />
            <section className="ds-card px-5 py-4">
              <label htmlFor="reminder-time" className="ds-h3 block">
                A daily time for your Practice
              </label>
              <p className="mt-1 text-[0.85rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                We&rsquo;ll send a gentle reminder. You can change it anytime.
              </p>
              <input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(event) => setReminderTime(event.target.value)}
                className="ds-field ds-num mt-3 text-[1.05rem]"
              />
            </section>
            {notice ? <p role="status" className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>{notice}</p> : null}
            <button type="button" onClick={() => void startPath()} disabled={busy} className="ds-filled w-full">
              {busy ? "Setting up your path" : `Start ${path.title}`}
            </button>
          </>
        ) : null}

        {loaded && stage === "dashboard" && enrollment ? (
          <>
            <span className="relative block h-28 overflow-hidden rounded-[var(--ds-radius-lg)]" aria-hidden="true">
              <PathScene pathId={path.id} className="absolute inset-0 h-full w-full" />
            </span>
            <div>
              <h1 className="ds-display text-[1.85rem]">{path.title}</h1>
              <p className="mt-1.5 text-[0.95rem]" style={{ color: "var(--ds-text-secondary)" }}>
                Small actions, repeated gently.
              </p>
            </div>
            <dl className="ds-card grid grid-cols-3 divide-x py-4 text-center">
              <Stat value={enrollment.completions.length} label={`of ${PATH_LENGTH_DAYS} days`} />
              <Stat value={programmeStreak(enrollment)} label="day rhythm" />
              <Stat value={longestProgrammeStreak(enrollment)} label="longest" />
            </dl>
            {enrollment.status === "completed" ? (
              <section className="rounded-[var(--ds-radius-lg)] px-5 py-5" style={{ background: tint }}>
                <p className="ds-label uppercase">14 days complete</p>
                <h2 className="ds-h2 mt-2">You built this, day by day.</h2>
                <p className="mt-1 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                  Revisit any day below, or begin the path again whenever you like.
                </p>
                <button type="button" onClick={restart} className="ds-outlined mt-4 w-full">
                  Begin again
                </button>
              </section>
            ) : day ? (
              <section className="rounded-[var(--ds-radius-lg)] px-5 py-5" style={{ background: tint }}>
                <p className="ds-label uppercase" style={{ color: "var(--ds-text-secondary)" }}>
                  Day {dayNumber}
                </p>
                <h2 className="ds-h2 mt-2">{day.title}</h2>
                <p className="mt-1 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                  {day.intention}
                </p>
                <p className="ds-caption ds-num mt-3">
                  {day.minutes} min · {path.frequencyHz} Hz
                </p>
                <button type="button" onClick={beginToday} className="ds-filled mt-4 w-full">
                  Begin today&rsquo;s Practice
                </button>
              </section>
            ) : null}
            <section aria-labelledby="trail-title" className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 id="trail-title" className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
                  Your path
                </h2>
                <span className="ds-caption">Swipe to see all {path.days.length} days</span>
              </div>
              <div className="overflow-hidden rounded-[var(--ds-radius-lg)] px-2 py-4" style={{ background: `color-mix(in srgb, var(--ds-outcome-${tone}) 7%, var(--ds-surface))` }}>
                <PathTrail
                  path={path}
                  enrollment={enrollment}
                  today={enrollment.status === "completed" ? null : dayNumber}
                  tone={tone}
                  onBeginToday={beginToday}
                />
              </div>
            </section>
            <p className="ds-caption">
              Daily reminder ·{" "}
              {enrollment.reminderEnabled ? `on at ${enrollment.reminderTime}` : `${enrollment.reminderTime}, reminders are off`}
            </p>
          </>
        ) : null}

        {loaded && stage === "checkin" && day ? (
          <>
            <div>
              <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
                Day {dayNumber} · Before today&rsquo;s sound
              </p>
              <h1 className="ds-display mt-2 text-[1.6rem]">{day.checkInPrompt}</h1>
            </div>
            <textarea
              aria-label="About yesterday"
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
              placeholder="A few words about yesterday"
              rows={3}
              className="ds-field resize-none leading-6"
            />
            <fieldset>
              <legend className="ds-h3">How strongly did it affect you?</legend>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={rating === value}
                    onClick={() => {
                      haptic("tap");
                      setRating(value);
                    }}
                    className="ds-chip ds-num justify-center !px-0 text-base"
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="ds-caption mt-1.5 flex justify-between">
                <span>Very little</span>
                <span>A lot</span>
              </div>
            </fieldset>
            <section className="space-y-3">
              <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
                Today&rsquo;s exercise
              </p>
              <h2 className="ds-h2">{day.exercise}</h2>
              <textarea
                aria-label="Your response to today's exercise"
                value={exercise}
                onChange={(event) => setExercise(event.target.value)}
                placeholder="Write your response, or what you noticed"
                rows={4}
                className="ds-field resize-none leading-6"
              />
            </section>
            <button type="button" onClick={saveCheckIn} className="ds-filled w-full">
              Continue to action and sound
            </button>
          </>
        ) : null}

        {loaded && stage === "day" && day ? (
          <>
            <div>
              <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
                Day {dayNumber} of {PATH_LENGTH_DAYS}
              </p>
              <h1 className="ds-display mt-2 text-[1.75rem]">{day.title}</h1>
              <p className="mt-2 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                {day.intention}
              </p>
            </div>
            {savedCheckIn?.exerciseResponse ? (
              <section className="ds-card px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
                    What you wrote
                  </p>
                  <button type="button" onClick={() => go("checkin")} className="ds-tap min-h-11 rounded-full px-3 text-sm font-semibold" style={{ color: "var(--ds-accent)" }}>
                    Edit
                  </button>
                </div>
                <p className="mt-1 text-[0.92rem] leading-6">{savedCheckIn.exerciseResponse}</p>
              </section>
            ) : null}
            <section className="rounded-[var(--ds-radius-lg)] px-5 py-5" style={{ background: tint }}>
              <p className="ds-label uppercase" style={{ color: "var(--ds-text-secondary)" }}>
                In real life
              </p>
              <h2 className="ds-h2 mt-2">Your small action</h2>
              <p className="mt-1 text-[0.95rem] leading-6">{day.action}</p>
            </section>
            <button type="button" onClick={startDayPause} disabled={busy} className="ds-filled w-full">
              {busy ? "Starting your Pause" : `Start your ${day.minutes} minute Pause`}
            </button>
          </>
        ) : null}

        {loaded && stage === "complete" && enrollment ? (
          <div className="grid justify-items-center gap-5 pt-6 text-center">
            <span className="relative grid h-32 w-32 place-items-center" aria-hidden="true">
              <span className="celebrate-glow ds-breathe absolute inset-0 rounded-full" />
              <span className="relative grid h-14 w-14 place-items-center rounded-full" style={{ background: "#e0a868", color: "#fff" }}>
                <IconCheck className="h-7 w-7" />
              </span>
            </span>
            <div>
              <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
                {enrollment.status === "completed" ? "14 days complete" : `Day ${enrollment.completions.length} complete`}
              </p>
              <h1 className="ds-display mt-2 text-[1.75rem]">
                {enrollment.status === "completed" ? "You completed this path." : "You showed up."}
              </h1>
              <p className="mx-auto mt-2 max-w-[20rem] text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                A small practice still counts. Let the action carry into the rest of your day.
              </p>
            </div>
            <section className="ds-card w-full px-5 py-4 text-left">
              <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
                Carry this with you
              </p>
              <p className="mt-1 text-[0.95rem] leading-6">
                {path.days[Math.max(0, enrollment.completions.length - 1)]?.action}
              </p>
            </section>
            <button type="button" onClick={() => go("dashboard")} className="ds-filled w-full">
              Back to your path
            </button>
          </div>
        ) : null}

      </div>
    </PauseShell>
  );
}

const backStyle = { background: "var(--ds-surface)", color: "var(--ds-text)", boxShadow: "var(--ds-elevation-1)" };

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-1">
      <dt className="sr-only">{label}</dt>
      <dd className="ds-num text-[1.45rem] leading-tight">{value}</dd>
      <dd className="ds-caption">{label}</dd>
    </div>
  );
}

export type { Programme };

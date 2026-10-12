"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ChakraGlyph, MoodLineIcon } from "@/components/chakra-symbol";
import { ChakraInspirationTag } from "@/components/chakra-inspiration-tag";
import { GlassCard, GoldButton, MvpShell } from "@/components/mvp-shell";
import { getSessionKey, isSessionUnlocked } from "@/lib/progress";
import { getPathCompletedCount, getPathStatus, PracticePath } from "@/lib/practice-paths";
import { useProgressStore } from "@/lib/use-progress-store";
import { ChakraDefinition, SessionDefinition } from "@/lib/types";

const sessionMoodIcons = ["grounded", "calm", "focus", "emotionally-lighter", "positive"] as const;

export function PracticePathScreen({ path }: { path: PracticePath }) {
  const router = useRouter();
  const progress = useProgressStore();
  const { chakra } = path;

  const completed = getPathCompletedCount(progress, path.id);
  const total = chakra.sessions.length;
  const status = getPathStatus(progress, path.id);
  const progressPercent = (completed / total) * 100;

  const nextSession = chakra.sessions.find(
    (session, index) => isSessionUnlocked(progress, chakra, index) && !progress.completedSessionKeys.includes(getSessionKey(chakra.id, session.id)),
  );

  return (
    <MvpShell>
      <div className="mx-auto max-w-xl space-y-3.5">
        <button
          type="button"
          onClick={() => router.push("/practice")}
          className="grid h-10 w-10 place-items-center rounded-full border border-[var(--ip-border)] bg-white/70 text-[var(--ip-ink)]"
          aria-label="Back to Practice Paths"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <GlassCard className="p-5 text-center">
          <span
            className="mx-auto grid h-20 w-20 place-items-center rounded-full border"
            style={{ borderColor: `${chakra.color}55`, color: chakra.color, background: `${chakra.color}14` }}
          >
            <ChakraGlyph chakraId={chakra.id} className="h-11 w-11" />
          </span>
          <h1 className="mt-3 font-serif text-2xl text-[var(--ip-ink)]">{path.label}</h1>
          <p className="mt-1 text-sm leading-5 text-[var(--ip-body)]">{path.tagline}</p>
          <div className="mt-2 flex justify-center">
            <ChakraInspirationTag chakraId={chakra.id} />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[var(--ip-ink)]">Day {completed} / {total}</span>
              <span className="text-[var(--ip-muted)]">{status === "completed" ? "Completed" : "In progress"}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ip-lavender)]">
              <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, backgroundColor: chakra.color }} />
            </div>
          </div>

          {nextSession ? (
            <Link href={`/session/${chakra.id}/${nextSession.id}/setup`} className="mt-4 block">
              <GoldButton className="w-full">Continue</GoldButton>
            </Link>
          ) : null}
        </GlassCard>

        <div className="space-y-2">
          {chakra.sessions.map((session, index) => (
            <PathSessionRow
              key={session.id}
              chakra={chakra}
              session={session}
              index={index}
              completed={progress.completedSessionKeys.includes(getSessionKey(chakra.id, session.id))}
              unlocked={isSessionUnlocked(progress, chakra, index)}
            />
          ))}
        </div>
      </div>
    </MvpShell>
  );
}

function PathSessionRow({
  chakra,
  session,
  index,
  completed,
  unlocked,
}: {
  chakra: ChakraDefinition;
  session: SessionDefinition;
  index: number;
  completed: boolean;
  unlocked: boolean;
}) {
  const name = session.name.replace(chakra.name.replace(" Chakra", ""), "").trim();

  const content = (
    <>
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border"
        style={{
          borderColor: completed || unlocked ? `${chakra.color}55` : "var(--ip-border)",
          color: completed || unlocked ? chakra.color : "var(--ip-muted)",
          background: completed ? `${chakra.color}1c` : "white",
        }}
      >
        <MoodLineIcon moodId={sessionMoodIcons[index]} className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-base text-[var(--ip-ink)]">{index + 1}. {name}</span>
        <span className="mt-0.5 block text-xs text-[var(--ip-muted)]">{session.durationMinutes} min</span>
      </span>
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs"
        style={{
          borderColor: completed || unlocked ? `${chakra.color}55` : "var(--ip-border)",
          color: completed || unlocked ? chakra.color : "var(--ip-muted)",
          background: completed ? `${chakra.color}1c` : "transparent",
        }}
      >
        {completed ? "✓" : unlocked ? "▶" : "🔒"}
      </span>
    </>
  );

  if (!unlocked) {
    return <GlassCard className="flex items-center gap-3 p-3 opacity-60">{content}</GlassCard>;
  }

  return (
    <Link href={`/session/${chakra.id}/${session.id}/setup`} className="block">
      <GlassCard className="flex items-center gap-3 p-3 transition active:scale-[0.99]">{content}</GlassCard>
    </Link>
  );
}

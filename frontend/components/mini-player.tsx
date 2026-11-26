"use client";

import { useRouter } from "next/navigation";

import { IconPauseGlyph, IconPlayGlyph } from "@/components/pause-icons";
import { formatTime, plainTitle, sessionIsActive, usePauseSession } from "@/components/pause-session";
import { chakraMap } from "@/data/chakras";
import { haptic } from "@/lib/haptics";

// The running Pause, above the tab bar, while you're elsewhere in the app:
// its name, time left and play/pause. Tap it to open the player. If it
// ends while you're away, it waits for you with the check-in.
export function MiniPlayer() {
  const router = useRouter();
  const session = usePauseSession();
  const { record, phase, elapsed, playing } = session;
  if (!record || !sessionIsActive(session)) return null;

  const ended = phase === "closing" || phase === "checkin";
  const color = chakraMap[record.chakraId]?.color ?? "#C4B5FD";
  const progress = ended ? 1 : Math.min(1, elapsed / record.durationSeconds);
  const status = ended
    ? "Pause complete · Check in"
    : phase === "transition"
      ? "Ready when you are"
      : `${formatTime(Math.max(0, record.durationSeconds - elapsed))} left`;

  const open = () => {
    haptic("tap");
    router.push(`/pause/player?session=${record.id}`);
  };

  return (
    // Clear of the tab bar's raised Pause button, which rises into this space.
    <div className="mx-auto max-w-[30rem] px-3 pb-6 pt-2 md:max-w-[40rem]">
      <div
        className="mini-player flex items-center gap-1 rounded-[1.1rem] py-1.5 pl-1.5 pr-1.5"
        style={{
          background: "var(--ds-navy)",
          color: "var(--ds-on-navy)",
          boxShadow: "0 8px 22px rgba(29, 27, 76, 0.28), inset 0 0 0 1px rgba(248, 250, 252, 0.08)",
        }}
      >
        <button type="button" onClick={open} aria-label={`Open your Pause: ${plainTitle(record.title)}, ${status}`} className="ds-tap flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-[0.9rem] px-1.5 text-left">
          <ProgressRing progress={progress} color={color} glowing={playing && !ended} />
          <span className="min-w-0">
            <span className="block truncate text-[0.9rem] font-semibold">{plainTitle(record.title)}</span>
            <span className="ds-num block truncate text-[0.78rem]" style={{ color: ended ? "#C4B5FD" : "var(--ds-on-navy-muted)" }}>
              {status}
            </span>
          </span>
        </button>
        {ended ? null : (
          <button
            type="button"
            onClick={session.togglePlayback}
            aria-label={playing ? "Pause" : "Play"}
            className="ds-tap grid h-12 w-12 shrink-0 place-items-center rounded-full"
            style={{ background: "rgba(248,250,252,0.12)" }}
          >
            {playing ? <IconPauseGlyph className="h-5 w-5" /> : <IconPlayGlyph className="ml-0.5 h-5 w-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function ProgressRing({ progress, color, glowing }: { progress: number; color: string; glowing: boolean }) {
  const radius = 15;
  const length = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 36 36" className={`h-9 w-9 shrink-0 ${glowing ? "ds-breathe" : ""}`} aria-hidden="true">
      <circle cx="18" cy="18" r={radius} fill="none" stroke="rgba(248,250,252,0.16)" strokeWidth="3" />
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - progress)}
        transform="rotate(-90 18 18)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
      <circle cx="18" cy="18" r="5" fill={color} opacity="0.9" />
    </svg>
  );
}

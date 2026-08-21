"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { IconChevronRight, IconMic, IconPencil } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import type { BigMomentMode } from "@/lib/big-moment-engine";
import { interpretTellInput, tellChips } from "@/lib/tell-interpreter";
import { createTellEntry } from "@/lib/tell-storage";
import { useVoiceTranscription } from "@/lib/use-voice-transcription";

type Mode = "write" | "speak";

const MOMENT_MODE_COPY: Record<BigMomentMode, string> = {
  before: "Coming up",
  during: "Happening now",
  after: "Just happened",
};

function readMomentMode(value: string | null): BigMomentMode | undefined {
  return value === "before" || value === "during" || value === "after" ? value : undefined;
}

// Tell Inner Pause — Compose (docs/UX_ARCHITECTURE.md §2): Write or Speak,
// optional chips surfaced only once there's input, submit → Recommended
// Pause. The user is never forced to choose an emotion — chips are always
// optional, and Speak always degrades cleanly to Write on any failure.
export function TellComposeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode: Mode = searchParams.get("mode") === "speak" ? "speak" : "write";
  const momentMode = readMomentMode(searchParams.get("momentMode"));
  const [mode, setMode] = useState<Mode>(initialMode);
  const [writeText, setWriteText] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const voice = useVoiceTranscription();

  const currentText = mode === "speak" ? voice.transcript : writeText;

  // Home's Speak button (?mode=speak) lands directly in an active mic state
  // rather than requiring a second tap — start() call happens inside the
  // effect, but the resulting setState calls live inside the hook's own
  // async callbacks, not synchronously in this effect body.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (initialMode !== "speak" || autoStartedRef.current) return;
    autoStartedRef.current = true;
    voice.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  // Explicit, event-driven carry-over between modes — not an effect — so
  // switching Write <-> Speak keeps whatever was already said/typed intact.
  const switchMode = (next: Mode) => {
    if (next === mode) return;
    if (next === "speak") voice.setTranscript(writeText);
    else setWriteText(voice.transcript);
    setMode(next);
  };

  const toggleChip = (chip: string) => {
    setSelectedChips((current) => (current.includes(chip) ? current.filter((item) => item !== chip) : [...current, chip]));
  };

  const handleSubmit = async () => {
    const trimmed = currentText.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    voice.stop();
    const interpretation = await interpretTellInput(trimmed, selectedChips, momentMode);
    const entry = createTellEntry({ text: trimmed, source: mode, chips: selectedChips, interpretation, momentMode });
    router.push(`/tell/recommended?entry=${entry.id}`);
  };

  return (
    <PauseShell>
      <div className="space-y-5 pb-4 pt-2">
        <header>
          <Link
            href="/"
            className="ds-tap inline-flex items-center gap-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            <IconChevronRight className="h-3.5 w-3.5" style={{ transform: "scaleX(-1)" }} />
            Home
          </Link>
          <h1 className="mt-2 text-[1.4rem] font-semibold leading-tight tracking-[-0.01em]">What&rsquo;s on your mind?</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            Say it or write it. We&rsquo;ll help you find the right Pause.
          </p>
          {momentMode ? (
            <p className="mt-1 text-xs font-medium" style={{ color: "var(--ds-accent)" }}>
              {MOMENT_MODE_COPY[momentMode]}
            </p>
          ) : null}
        </header>

        <div className="inline-flex rounded-full p-1" style={{ background: "var(--ds-surface)" }}>
          {(["write", "speak"] as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchMode(item)}
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
          <section aria-label="Speak" className="space-y-3 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
            <div className="grid place-items-center gap-2 py-2 text-center">
              <button
                type="button"
                onClick={voice.status === "listening" ? voice.stop : voice.start}
                aria-pressed={voice.status === "listening"}
                aria-label={voice.status === "listening" ? "Stop listening" : "Start speaking"}
                className="ds-tap relative grid h-16 w-16 place-items-center rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ds-accent)]"
                style={{
                  borderColor: voice.status === "listening" ? "var(--ds-accent)" : "var(--ds-border)",
                  background: voice.status === "listening" ? "var(--ds-accent-soft)" : "var(--ds-bg)",
                  color: "var(--ds-accent)",
                }}
              >
                <IconMic className="h-6 w-6" />
              </button>
              <p className="text-sm font-medium">
                {voice.status === "listening" ? "Listening…" : "Tap to speak"}
              </p>
              {voice.status === "listening" ? (
                <button
                  type="button"
                  onClick={voice.cancel}
                  className="text-xs font-medium underline decoration-dotted underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                  style={{ color: "var(--ds-text-secondary)" }}
                >
                  Cancel
                </button>
              ) : null}
            </div>

            {voice.error ? (
              <p className="text-xs" style={{ color: "var(--ds-error)" }}>
                {voice.error}
              </p>
            ) : null}

            <textarea
              value={voice.transcript}
              onChange={(event) => voice.setTranscript(event.target.value)}
              placeholder="Your words will appear here — edit anytime before continuing."
              rows={4}
              className="w-full resize-none rounded-[var(--ds-radius-sm)] border bg-transparent p-3 text-sm leading-6 outline-none placeholder:text-[var(--ds-text-muted)]"
              style={{ borderColor: "var(--ds-border)", color: "var(--ds-text)" }}
            />
          </section>
        ) : (
          <textarea
            value={writeText}
            onChange={(event) => setWriteText(event.target.value)}
            placeholder="What's happening? What's on your mind?"
            rows={6}
            autoFocus
            className="w-full resize-none rounded-[var(--ds-radius-md)] border bg-transparent p-4 text-base leading-6 outline-none placeholder:text-[var(--ds-text-muted)]"
            style={{ borderColor: "var(--ds-border)", background: "var(--ds-surface)", color: "var(--ds-text)" }}
          />
        )}

        {currentText.trim() ? (
          <section aria-label="Optional context">
            <p className="text-xs font-medium" style={{ color: "var(--ds-text-secondary)" }}>
              Anything else? (optional)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tellChips.map((chip) => {
                const active = selectedChips.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleChip(chip)}
                    className="ds-tap min-h-9 rounded-full border px-3.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                    style={{
                      borderColor: active ? "var(--ds-accent)" : "var(--ds-border)",
                      background: active ? "var(--ds-accent-soft)" : "transparent",
                      color: active ? "var(--ds-accent)" : "var(--ds-text-secondary)",
                    }}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <button
          type="button"
          disabled={!currentText.trim() || submitting}
          onClick={handleSubmit}
          className="ds-tap min-h-12 w-full rounded-full text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
          style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
        >
          {submitting ? "Finding the right Pause…" : "Continue"}
        </button>
      </div>
    </PauseShell>
  );
}

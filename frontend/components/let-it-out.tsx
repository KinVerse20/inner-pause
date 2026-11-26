"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { IconMic, IconPencil } from "@/components/pause-icons";
import { haptic } from "@/lib/haptics";
import { SpeechLanguageToggle } from "@/components/speech-language-toggle";
import { useVoiceTranscription } from "@/lib/use-voice-transcription";

// Letting it out, inside a Moment's Pause (pause-player-screen.tsx). The
// Pause is already running; this is only an offer you can ignore. Speak or
// write in a panel over the Pause, with nothing read back, judged or
// analysed: it's yours, kept with the Moment in your Journey. Closing the
// panel keeps the words and leaves you in your Pause.

export type LetOutMode = "speak" | "write";

/** The soft offer, in the running Pause. */
export function LetItOutOffer({ onOpen }: { onOpen: (mode: LetOutMode) => void }) {
  return (
    <section
      aria-label="Let it out"
      className="ds-settle flex w-full max-w-[22rem] items-center gap-2 rounded-[var(--ds-radius-lg)] py-2 pl-4 pr-2 text-left"
      style={{ background: "rgba(196,181,253,0.08)", boxShadow: "inset 0 0 0 1px rgba(196,181,253,0.16)" }}
    >
      <p className="min-w-0 flex-1 whitespace-nowrap text-[0.95rem]" style={{ color: "var(--ds-on-navy)" }}>
        Want to let it out?
      </p>
      <OfferButton label="Speak" icon={<IconMic className="h-4 w-4" />} onClick={() => onOpen("speak")} />
      <OfferButton label="Write" icon={<IconPencil className="h-4 w-4" />} onClick={() => onOpen("write")} />
    </section>
  );
}

function OfferButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic("tap");
        onClick();
      }}
      className="ds-tap inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold"
      style={{ background: "rgba(248,250,252,0.1)", color: "var(--ds-on-navy)" }}
    >
      <span style={{ color: "#DDD6FE" }}>{icon}</span>
      {label}
    </button>
  );
}

/**
 * The panel over the running Pause. Done (or closing it any way) keeps what
 * was let out; empty keeps nothing.
 */
export function LetItOutPanel({
  mode,
  prompt,
  onClose,
}: {
  mode: LetOutMode;
  /** The Moment's own invitation, e.g. "Get it off your chest, however it comes." */
  prompt: string;
  onClose: (text: string, source: LetOutMode) => void;
}) {
  const [view, setView] = useState<LetOutMode>(mode);
  const [text, setText] = useState("");
  const voice = useVoiceTranscription();
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  // Opened to speak: listening starts straight away.
  useEffect(() => {
    if (mode === "speak") voice.start();
    // Once, on opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view === "write") fieldRef.current?.focus();
  }, [view]);

  const done = () => {
    if (view === "speak") voice.stop();
    haptic("moment");
    onClose((view === "speak" ? voice.transcript : text).trim(), view);
  };

  // Escape closes it, keeping the words, like Done.
  const doneRef = useRef(done);
  useEffect(() => {
    doneRef.current = done;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") doneRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const speaking = view === "speak";
  const listening = voice.status === "listening";
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation" style={{ colorScheme: "dark" }}>
      <button type="button" aria-label="Done, back to your Pause" onClick={done} className="sheet-backdrop absolute inset-0 cursor-default" style={{ background: "rgba(10, 9, 32, 0.55)" }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Let it out"
        className="sheet-panel relative grid w-full max-w-[30rem] gap-4 rounded-t-[1.75rem] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3"
        style={{ background: "#232057", color: "var(--ds-on-navy)", boxShadow: "0 -12px 40px rgba(0,0,0,0.35)" }}
      >
        <span className="mx-auto block h-1 w-10 rounded-full" style={{ background: "rgba(248,250,252,0.25)" }} aria-hidden="true" />
        <p className="text-center text-sm leading-6" style={{ color: "var(--ds-on-navy-muted)" }}>
          {prompt}
        </p>
        {speaking ? (
          <div className="grid justify-items-center gap-4">
            <button
              type="button"
              onClick={() => (listening ? voice.stop() : voice.start())}
              aria-label={listening ? "Stop listening" : "Start speaking"}
              aria-pressed={listening}
              className="ds-tap relative grid h-20 w-20 place-items-center rounded-full"
              style={{ background: listening ? "#C4B5FD" : "rgba(248,250,252,0.1)", color: listening ? "#1D1B4C" : "var(--ds-on-navy)" }}
            >
              {listening ? <span className="ds-breathe absolute -inset-3 rounded-full" style={{ background: "rgba(196,181,253,0.18)" }} aria-hidden="true" /> : null}
              <IconMic className="relative h-7 w-7" />
            </button>
            <SpeechLanguageToggle language={voice.language} onChange={voice.setLanguage} dark />
            <p className="ds-caption" style={{ color: "var(--ds-on-navy-muted)" }}>
              {listening ? "Listening. Take your time." : voice.status === "unsupported" ? "Speaking isn't available here. You can write instead." : "Tap to speak"}
            </p>
            <div className="max-h-[32dvh] min-h-[6rem] w-full overflow-y-auto rounded-[var(--ds-radius-md)] px-4 py-3 text-[1rem] leading-7" style={{ background: "rgba(248,250,252,0.06)" }}>
              {voice.transcript || <span style={{ color: "var(--ds-on-navy-muted)" }}>Your words will appear here.</span>}
            </div>
            {voice.status === "unsupported" || voice.error ? (
              <button type="button" onClick={() => setView("write")} className="ds-tap min-h-11 text-sm font-semibold" style={{ color: "#C4B5FD" }}>
                Write instead
              </button>
            ) : null}
          </div>
        ) : (
          <textarea
            ref={fieldRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-label="Let it out"
            placeholder="Say it however it comes."
            rows={7}
            className="w-full resize-none rounded-[var(--ds-radius-md)] px-4 py-3 text-[1rem] leading-7 outline-none placeholder:text-[rgba(248,250,252,0.45)] focus-visible:ring-2 focus-visible:ring-[#C4B5FD]"
            style={{ background: "rgba(248,250,252,0.06)", color: "var(--ds-on-navy)" }}
          />
        )}
        <button
          type="button"
          onClick={done}
          className="ds-tap min-h-12 w-full rounded-full text-[0.95rem] font-semibold"
          style={{ background: "var(--ds-on-navy)", color: "var(--ds-navy)" }}
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import { IconMic, IconPencil } from "@/components/pause-icons";
import { haptic } from "@/lib/haptics";
import { useVoiceTranscription } from "@/lib/use-voice-transcription";

// Letting it out, before a Moment's Pause (pause-player-screen.tsx). The
// sound is already playing; this is only an offer. Speak or write, with
// nothing read back, judged or analysed: it's yours, kept with the Moment
// in your Journey. Or just breathe and begin.

type View = "offer" | "write" | "speak";

export function LetItOut({
  prompt,
  onBegin,
}: {
  /** The mode's own invitation, e.g. "Let it out. Nobody else will read this." */
  prompt: string;
  /** Begins the Pause, with whatever was let out (empty when nothing was). */
  onBegin: (text: string, source: "write" | "speak") => void;
}) {
  const [view, setView] = useState<View>("offer");
  const [text, setText] = useState("");
  const voice = useVoiceTranscription();
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (view === "write") fieldRef.current?.focus();
  }, [view]);

  const begin = (source: "write" | "speak") => {
    if (source === "speak") voice.stop();
    haptic("moment");
    onBegin((source === "speak" ? voice.transcript : text).trim(), source);
  };

  if (view === "offer") {
    return (
      <div className="ds-settle grid w-full max-w-[20rem] justify-items-center gap-5 text-center">
        <div className="space-y-2">
          <p className="text-lg font-semibold" style={{ color: "var(--ds-on-navy)" }}>
            Want to let it out first?
          </p>
          <p className="text-sm leading-6" style={{ color: "var(--ds-on-navy-muted)" }}>
            {prompt}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2.5">
          <OfferButton
            label="Speak"
            icon={<IconMic className="h-5 w-5" />}
            onClick={() => {
              haptic("tap");
              setView("speak");
              voice.start();
            }}
          />
          <OfferButton
            label="Write"
            icon={<IconPencil className="h-5 w-5" />}
            onClick={() => {
              haptic("tap");
              setView("write");
            }}
          />
        </div>
        <button type="button" onClick={() => begin("write")} className="ds-tap min-h-11 rounded-full px-4 text-sm font-semibold" style={{ color: "#C4B5FD" }}>
          Just breathe
        </button>
      </div>
    );
  }

  const speaking = view === "speak";
  const listening = voice.status === "listening";
  return (
    <div className="ds-settle grid w-full max-w-[22rem] gap-4">
      <p className="text-center text-sm" style={{ color: "var(--ds-on-navy-muted)" }}>
        Let it all out. Nobody else will read this.
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
          <p className="ds-caption" style={{ color: "var(--ds-on-navy-muted)" }}>
            {listening ? "Listening. Take your time." : voice.status === "unsupported" ? "Speaking isn't available here. You can write instead." : "Tap to speak"}
          </p>
          <div className="max-h-[38dvh] min-h-[6rem] w-full overflow-y-auto rounded-[var(--ds-radius-md)] px-4 py-3 text-[1rem] leading-7" style={{ background: "rgba(248,250,252,0.06)", color: "var(--ds-on-navy)" }}>
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
          rows={8}
          className="w-full resize-none rounded-[var(--ds-radius-md)] px-4 py-3 text-[1rem] leading-7 outline-none placeholder:text-[rgba(248,250,252,0.45)] focus-visible:ring-2 focus-visible:ring-[#C4B5FD]"
          style={{ background: "rgba(248,250,252,0.06)", color: "var(--ds-on-navy)" }}
        />
      )}
      <button
        type="button"
        onClick={() => begin(speaking ? "speak" : "write")}
        className="ds-tap min-h-12 w-full rounded-full text-[0.95rem] font-semibold"
        style={{ background: "var(--ds-on-navy)", color: "var(--ds-navy)" }}
      >
        Begin my Pause
      </button>
    </div>
  );
}

function OfferButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ds-tap grid min-h-[5.5rem] justify-items-center gap-2 rounded-[var(--ds-radius-md)] py-4 text-[0.95rem] font-semibold"
      style={{ background: "rgba(248,250,252,0.08)", color: "var(--ds-on-navy)", boxShadow: "inset 0 0 0 1px rgba(248,250,252,0.08)" }}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "rgba(196,181,253,0.18)", color: "#DDD6FE" }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

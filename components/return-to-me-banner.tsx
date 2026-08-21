"use client";

import { useEffect, useState } from "react";

import { IconClose, IconMic, IconPencil } from "@/components/pause-icons";
import { dismissReturnToMe, getActiveReturnToMe, markReturnToMeSurfaced, respondToReturnToMe } from "@/lib/return-to-me";
import { createTellEntry, linkTellEntryToMoment, NOT_ROUTED_INTERPRETATION } from "@/lib/tell-storage";
import { useVoiceTranscription } from "@/lib/use-voice-transcription";
import type { MomentRecord } from "@/lib/moment-storage";

// Return to Me (docs/PRODUCT_FLOW.md §15): a contextual in-app surface, not
// a tab, not a permanent Home card — mounted on the Moments screen only
// (components/moments-screen.tsx), the one place in this slice's scope
// where "a moment that makes sense" to check in exists. Journey doesn't
// exist yet to also host it there, per this slice's stated scope.
export function ReturnToMeBanner() {
  const [moment, setMoment] = useState<MomentRecord | null | undefined>(undefined);
  const [composeMode, setComposeMode] = useState<"write" | "speak" | null>(null);
  const [writeText, setWriteText] = useState("");
  const [saving, setSaving] = useState(false);
  const voice = useVoiceTranscription();

  // One-time read from an external system (localStorage) on mount — no
  // async boundary to defer into, since the read itself is synchronous.
  useEffect(() => {
    const active = getActiveReturnToMe();
    if (active) markReturnToMeSurfaced(active.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMoment(active);
  }, []);

  if (!moment) return null;

  const currentText = composeMode === "speak" ? voice.transcript : writeText;

  const situationPhrase = moment.situationLabel ? moment.situationLabel.toLowerCase() : null;
  const question = situationPhrase ? `How did the ${situationPhrase} go?` : "How did it go?";

  const handleDismiss = () => {
    dismissReturnToMe(moment.id);
    setMoment(null);
  };

  const handleSave = () => {
    const trimmed = currentText.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    voice.stop();
    respondToReturnToMe(moment.id, trimmed);
    const entry = createTellEntry({
      text: trimmed,
      source: composeMode ?? "write",
      chips: [],
      interpretation: NOT_ROUTED_INTERPRETATION,
      momentMode: moment.mode,
    });
    linkTellEntryToMoment(entry.id, moment.id);
    setMoment(null);
  };

  return (
    <section
      aria-label="Return to Me"
      className="space-y-3 rounded-[var(--ds-radius-md)] border px-4 py-4"
      style={{ borderColor: "var(--ds-accent)", background: "var(--ds-accent-soft)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.95rem] font-semibold leading-snug">{question}</p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss Return to Me"
          className="ds-tap grid h-8 w-8 shrink-0 place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          style={{ color: "var(--ds-text-secondary)" }}
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>

      {composeMode === null ? (
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setComposeMode("write")}
            className="ds-tap flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
          >
            <IconPencil className="h-4 w-4" />
            Write
          </button>
          <button
            type="button"
            onClick={() => {
              setComposeMode("speak");
              voice.start();
            }}
            className="ds-tap flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ borderColor: "var(--ds-accent)", color: "var(--ds-accent)", background: "var(--ds-bg)" }}
          >
            <IconMic className="h-4 w-4" />
            Speak
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <textarea
            value={currentText}
            onChange={(event) => (composeMode === "speak" ? voice.setTranscript(event.target.value) : setWriteText(event.target.value))}
            placeholder="Your words will appear here — edit anytime before saving."
            rows={3}
            autoFocus={composeMode === "write"}
            className="w-full resize-none rounded-[var(--ds-radius-sm)] border bg-transparent p-3 text-sm leading-6 outline-none placeholder:text-[var(--ds-text-muted)]"
            style={{ borderColor: "var(--ds-border)", background: "var(--ds-bg)", color: "var(--ds-text)" }}
          />
          {voice.error ? (
            <p className="text-xs" style={{ color: "var(--ds-error)" }}>
              {voice.error}
            </p>
          ) : null}
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={!currentText.trim() || saving}
              onClick={handleSave}
              className="ds-tap min-h-10 flex-1 rounded-full text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] disabled:cursor-not-allowed disabled:opacity-55"
              style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="ds-tap min-h-10 rounded-full px-4 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              style={{ color: "var(--ds-text-secondary)" }}
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

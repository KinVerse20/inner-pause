"use client";

import { useState } from "react";

import { IconChevronDown } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { YouScreenHeader } from "@/components/settings-row";
import { submitFeedback, type FeedbackKind } from "@/lib/feedback-store";

// You -> Help/About (docs/PRODUCT_FLOW.md §28-30): concise, informational,
// not a marketing section. "Sound & Traditions" carries the broader
// educational context intentionally kept separate from the in-flow "Why
// this Pause?" panel (components/why-this-pause-panel.tsx).
const SECTIONS: Array<{ id: string; title: string; body: string[] }> = [
  {
    id: "why",
    title: "Why Inner Pause",
    body: [
      "Inner Pause exists because most days don't give you a real moment to feel what you're actually feeling.",
      "Emotional practice matters because noticing and naming what's happening is what lets it move — not staying busy past it.",
      "Sound is the way in, because it works before words do: it can settle a body that isn't ready to talk yet.",
      "And what you do after a Pause matters more than the Pause itself — this is meant to support your life, not replace it.",
    ],
  },
  {
    id: "how",
    title: "How it works",
    body: [
      "Pick what you're feeling, or tell Pause in your own words. A short sound experience meets you where you are.",
      "Afterward, you can say what helped. Over time, Journey remembers the pattern — never the other way around.",
    ],
  },
  {
    id: "sound",
    title: "Sound & Traditions",
    body: [
      "Inner Pause draws on traditional chakra associations and frequency work alongside a modern understanding of how sound affects the body.",
      "These traditions are old and the modern evidence for sound-based practices is still developing — we try to hold both honestly, without overstating either.",
      "Nothing here is a medical claim. It's one way of paying attention to yourself, offered transparently.",
    ],
  },
];

const FEEDBACK_OPTIONS: Array<{ id: FeedbackKind; label: string }> = [
  { id: "feature", label: "Suggest a feature" },
  { id: "bug", label: "Report a bug" },
  { id: "feedback", label: "Share feedback" },
];

export function YouHelpScreen() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [kind, setKind] = useState<FeedbackKind>("feedback");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) return;
    submitFeedback(kind, message.trim());
    setMessage("");
    setSent(true);
  };

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <YouScreenHeader title="Help / About" />

        <section className="space-y-2">
          {SECTIONS.map((section) => {
            const open = openId === section.id;
            return (
              <div key={section.id} className="rounded-[var(--ds-radius-md)] px-4 py-3.5" style={{ background: "var(--ds-surface)" }}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : section.id)}
                  className="ds-tap flex w-full items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                >
                  <span className="text-[0.95rem] font-semibold">{section.title}</span>
                  <IconChevronDown className="h-4 w-4 shrink-0" style={{ transform: open ? "rotate(180deg)" : undefined }} />
                </button>
                {open ? (
                  <div className="mt-2.5 space-y-2">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="text-[0.85rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>

        <section className="space-y-2.5 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
          <h2 className="text-[0.95rem] font-semibold">Help us build Pause better</h2>
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_OPTIONS.map((option) => {
              const active = kind === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setKind(option.id)}
                  className="ds-tap min-h-9 rounded-full border px-3 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                  style={{
                    borderColor: active ? "var(--ds-accent)" : "var(--ds-border)",
                    background: active ? "var(--ds-accent-soft)" : "transparent",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setSent(false);
            }}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full rounded-[var(--ds-radius-sm)] border px-3.5 py-2.5 text-[0.88rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ borderColor: "var(--ds-border)", background: "var(--ds-bg)" }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!message.trim()}
            className="ds-tap min-h-11 rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
          >
            Send
          </button>
          {sent ? (
            <p className="text-[0.78rem]" style={{ color: "var(--ds-success)" }}>
              Thank you. Saved on this device for now — sending it to us is coming soon.
            </p>
          ) : null}
        </section>
      </div>
    </PauseShell>
  );
}

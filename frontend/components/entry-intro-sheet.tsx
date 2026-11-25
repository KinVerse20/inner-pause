"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { haptic } from "@/lib/haptics";
import { HOW_IT_WORKS } from "@/lib/how-it-works";

// "How it works" (lib/how-it-works.ts), as a sheet. Optional by design
// (docs/PRODUCT_FLOW.md §39.A: Entry is not a mandatory carousel), so it
// opens only when asked for, from Entry. The last step begins, same as
// Entry's own Begin.

export function EntryIntroSheet({ onBegin, onClose }: { onBegin: () => void; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const step = HOW_IT_WORKS[index];
  const last = index === HOW_IT_WORKS.length - 1;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const next = () => {
    if (last) {
      onBegin();
      return;
    }
    haptic("tap");
    setIndex((value) => value + 1);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
      <button
        type="button"
        aria-label="Close how it works"
        onClick={onClose}
        className="sheet-backdrop absolute inset-0 cursor-default"
        style={{ background: "rgba(15, 23, 42, 0.35)" }}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-intro-title"
        className="sheet-panel relative w-full max-w-[30rem] rounded-t-[1.75rem] px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 outline-none"
        style={{ background: "var(--ds-surface)", color: "var(--ds-text)", boxShadow: "var(--ds-shadow-raised)" }}
      >
        <span className="mx-auto mb-4 block h-1 w-10 rounded-full" style={{ background: "var(--ds-border)" }} aria-hidden="true" />
        <div className="flex items-center justify-between">
          <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
            How it works · {index + 1} of {HOW_IT_WORKS.length}
          </p>
          <button type="button" onClick={onClose} className="ds-tap min-h-11 rounded-full px-3 text-sm font-semibold" style={{ color: "var(--ds-accent)" }}>
            Close
          </button>
        </div>

        <div key={index} className="ds-settle mt-3 min-h-[7.5rem]" aria-live="polite">
          <h2 id="entry-intro-title" className="ds-h2">
            {step.title}
          </h2>
          <p className="mt-2 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
            {step.body}
          </p>
          {last ? (
            <p className="ds-caption mt-4" style={{ color: "var(--ds-text-muted)" }}>
              Inner Pause supports everyday wellbeing. It is not a substitute for medical or mental health care.
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-center gap-2">
          {HOW_IT_WORKS.map((item, dotIndex) => (
            <button
              key={item.title}
              type="button"
              aria-label={`Step ${dotIndex + 1}: ${item.title}`}
              aria-current={dotIndex === index ? "step" : undefined}
              onClick={() => setIndex(dotIndex)}
              className="grid min-h-6 min-w-6 place-items-center"
            >
              <span
                className="block h-2 rounded-full transition-[width,background-color] duration-200"
                style={{ width: dotIndex === index ? "1.75rem" : "0.5rem", background: dotIndex === index ? "var(--ds-accent)" : "var(--ds-border)" }}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>

        <button type="button" onClick={next} className="ds-filled mt-5 w-full">
          {last ? "Begin" : "Next"}
        </button>
      </div>
    </div>,
    document.body,
  );
}

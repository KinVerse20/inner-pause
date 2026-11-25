"use client";

import Link from "next/link";
import { useState } from "react";

import { IconChevronDown, IconChevronRight } from "@/components/pause-icons";
import { chakraIdFromName } from "@/lib/chakra-guide";
import { buildWhyThisPauseContent, type WhyThisPauseInput } from "@/lib/pause-why-content";

// Shared collapsed-by-default "Why this Pause?" disclosure — same four-part
// structure and same component in both the Pause Player (dark) and Tell's
// Recommended Pause screen (light), per docs/PRODUCT_FLOW.md §9's "not two
// different depths of disclosure."
// `readMore` links to the energy-centre guide; off in the Pause Player,
// where leaving mid-session would break the Pause.
export function WhyThisPausePanel({ input, dark = false, readMore = !dark }: { input: WhyThisPauseInput; dark?: boolean; readMore?: boolean }) {
  const [open, setOpen] = useState(false);
  const content = buildWhyThisPauseContent(input);
  const chakraId = readMore ? chakraIdFromName(input.chakraName) : undefined;

  const triggerColor = dark ? "rgba(248,250,252,0.75)" : "var(--ds-text-secondary)";
  const panelBg = dark ? "rgba(248,250,252,0.08)" : "var(--ds-bg)";
  const panelColor = dark ? "rgba(248,250,252,0.85)" : "var(--ds-text-secondary)";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="ds-tap inline-flex min-h-11 items-center gap-1 text-xs underline decoration-dotted underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
        style={{ color: triggerColor }}
      >
        Why this Pause? <IconChevronDown className="h-3 w-3" style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </button>

      {open ? (
        <div
          className="max-w-[20rem] space-y-2.5 rounded-[var(--ds-radius-md)] px-4 py-3.5 text-left text-xs leading-5"
          style={{ background: panelBg, color: panelColor }}
        >
          <p>
            <strong>Chakra:</strong> {content.chakra}
          </p>
          <p>
            <strong>Frequency:</strong> {content.frequency}
          </p>
          <p>
            <strong>Together:</strong> {content.together}
          </p>
          <p>
            <strong>Why this helps:</strong> {content.whyThisHelps}
          </p>
          {chakraId ? (
            <Link href={`/chakras/${chakraId}?from=pause`} className="ds-tap inline-flex min-h-11 items-center gap-1 text-left font-semibold" style={{ color: dark ? "#C4B5FD" : "var(--ds-accent)" }}>
              Read more about the {input.chakraName.replace(/\s*chakra$/i, "")}, its tone and the other centres
              <IconChevronRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useState } from "react";

import { chakraMap } from "@/data/chakras";
import { chakraTraditionNotes } from "@/lib/practice-paths";
import type { ChakraId } from "@/lib/types";

// Collapsed-by-default, expandable tag shown beneath a skill/pause name on
// detail screens (docs/PRODUCT_ROADMAP.md #4): present and honest about the
// chakra association rather than hidden, but never louder than the skill
// name itself, and only rendered where a real association exists.
export function ChakraInspirationTag({ chakraId }: { chakraId: ChakraId }) {
  const [open, setOpen] = useState(false);
  const chakra = chakraMap[chakraId];

  return (
    <div className="inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 text-xs text-[var(--ip-muted)] underline decoration-dotted underline-offset-2"
        aria-expanded={open}
      >
        Traditional inspiration: {chakra.name.replace(" Chakra", "")}
        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <p className="mt-1.5 max-w-xs text-xs leading-5 text-[var(--ip-muted)]">
          {chakraTraditionNotes[chakraId]}
        </p>
      ) : null}
    </div>
  );
}

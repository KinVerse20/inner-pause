"use client";

import { useEffect, useRef, useState } from "react";

export function HelpTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        className="grid min-h-8 min-w-8 place-items-center rounded-full border border-purple-200 bg-white/70 text-xs text-[#6d28d9] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
      >
        ?
      </button>
      {open ? (
        <span role="tooltip" className="absolute right-0 top-10 z-50 w-56 rounded-2xl border border-purple-200 bg-white p-3 text-left text-xs leading-5 text-[#26156f] shadow-xl">
          {children}
        </span>
      ) : null}
    </span>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { IconYouTab } from "@/components/pause-icons";
import { getAccount, subscribeAccount } from "@/lib/account-store";
import { haptic } from "@/lib/haptics";

// The top of the You tab (your Journey): who you are here, and the gear
// to everything else (account, Pass, preferences, privacy, help at
// /profile), where Instagram, Headspace and Calm keep it.
export function YouHeader() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setName(getAccount()?.displayName?.trim() || null);
    read();
    return subscribeAccount(read);
  }, []);

  return (
    <header className="flex items-center gap-3.5">
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[1.15rem] font-semibold"
        style={
          name
            ? { background: "var(--ds-accent)", color: "var(--ds-accent-on)", boxShadow: "0 0 0 3px var(--ds-bg), 0 0 0 4.5px color-mix(in srgb, var(--ds-accent-secondary) 50%, transparent)" }
            : { background: "var(--ds-surface)", color: "var(--ds-text)", boxShadow: "var(--ds-elevation-1)" }
        }
        aria-hidden="true"
      >
        {name ? name[0].toUpperCase() : <IconYouTab className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="ds-display truncate text-[1.6rem] leading-tight">Your Journey</h1>
        <p className="truncate text-[0.9rem]" style={{ color: "var(--ds-text-secondary)" }}>
          {name ? name : "Your story, in your own words."}
        </p>
      </div>
      <Link
        href="/profile"
        aria-label="Settings: account, Pass, preferences and privacy"
        onClick={() => haptic("tap")}
        className="ds-icon-btn shrink-0"
        style={{ background: "var(--ds-surface)", color: "var(--ds-text)", boxShadow: "var(--ds-elevation-1)" }}
      >
        <IconGear className="h-5 w-5" />
      </Link>
    </header>
  );
}

function IconGear({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

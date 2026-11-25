"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { IconYouTab } from "@/components/pause-icons";
import { getAccount, subscribeAccount } from "@/lib/account-store";
import { haptic } from "@/lib/haptics";

// The way into You (account, Pass, preferences, privacy), top right on
// Home and Journey, where profile usually lives. Your initial once you've
// signed in, otherwise a quiet person mark.
export function YouAvatar() {
  const [initial, setInitial] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      const name = getAccount()?.displayName?.trim();
      setInitial(name ? name[0].toUpperCase() : null);
    };
    read();
    return subscribeAccount(read);
  }, []);

  return (
    <Link
      href="/profile"
      aria-label="You: account, Pass and settings"
      onClick={() => haptic("tap")}
      className="ds-icon-btn shrink-0"
      style={
        initial
          ? { background: "var(--ds-accent)", color: "var(--ds-accent-on)", boxShadow: "var(--ds-elevation-1)" }
          : { background: "var(--ds-surface)", color: "var(--ds-text)", boxShadow: "var(--ds-elevation-1)" }
      }
    >
      {initial ? <span className="text-[1rem] font-semibold">{initial}</span> : <IconYouTab className="h-5 w-5" />}
    </Link>
  );
}

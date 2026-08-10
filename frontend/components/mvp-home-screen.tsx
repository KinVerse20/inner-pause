"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MvpShell } from "@/components/mvp-shell";
import { RitualBackdrop } from "@/components/inner-world-ritual-ui";
import { usePlayer } from "@/components/player-provider";
import { BreathingRipple } from "@/components/ritual-motion-visuals";

export function MvpHomeScreen() {
  const router = useRouter();
  const player = usePlayer();
  const [opening, setOpening] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpening(false), 2600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <MvpShell>
      <RitualBackdrop tone="neutral" className="home-arrive-screen">
        <div className="home-arrive-layout">
          <h1 className="home-arrive-heading">What are you carrying today?</h1>

          <div className={opening ? "breath-ripple-opening" : ""}>
            <BreathingRipple
              className="home-arrive-ripple"
              label={"We are here\nto make you\nfeel lighter"}
            />
          </div>

          <div className="home-arrive-actions" aria-label="Choose how to begin">
            <HomeAction
              icon="♩"
              label="Speak"
              onClick={() => router.push("/journal?mode=speak")}
            />
            <HomeAction
              icon="✎"
              label="Write"
              onClick={() => router.push("/journal?mode=write")}
            />
            <HomeAction
              icon="ϟ"
              label="I need immediate relief"
              primary
              onClick={() => player.startQuickPlayback({ chakraId: "heart", moodId: "calm", duration: 20 })}
            />
          </div>
        </div>
      </RitualBackdrop>
    </MvpShell>
  );
}

function HomeAction({
  icon,
  label,
  primary = false,
  onClick,
}: {
  icon: string;
  label: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`home-arrive-action tap-ripple ${primary ? "is-primary" : ""}`.trim()}
    >
      <span className="home-arrive-action__icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

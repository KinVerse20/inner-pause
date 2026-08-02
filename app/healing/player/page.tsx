import { Suspense } from "react";

import { HealingAudioPlayerScreen } from "@/components/healing-audio-player-screen";

export default function HealingPlayerPage() {
  return (
    <Suspense>
      <HealingAudioPlayerScreen />
    </Suspense>
  );
}

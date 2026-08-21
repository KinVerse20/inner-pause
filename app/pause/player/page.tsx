import { Suspense } from "react";

import { PausePlayerScreen } from "@/components/pause-player-screen";

export default function PausePlayerPage() {
  return (
    <Suspense>
      <PausePlayerScreen />
    </Suspense>
  );
}

import { Suspense } from "react";

import { QuickPlayerScreen } from "@/components/quick-player-screen";

export default function QuickPlayerPage() {
  return (
    <Suspense fallback={null}>
      <QuickPlayerScreen />
    </Suspense>
  );
}

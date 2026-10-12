import { Suspense } from "react";

import { MvpJourneyScreen } from "@/components/mvp-journey-screen";

export default function HistoryPage() {
  return (
    <Suspense>
      <MvpJourneyScreen />
    </Suspense>
  );
}

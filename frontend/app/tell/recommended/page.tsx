import { Suspense } from "react";

import { TellRecommendedScreen } from "@/components/tell-recommended-screen";

export default function TellRecommendedPage() {
  return (
    <Suspense>
      <TellRecommendedScreen />
    </Suspense>
  );
}

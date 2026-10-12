import { Suspense } from "react";

import { AnalysisScreen } from "@/components/analysis-screen";

export default function AnalysisPage() {
  return (
    <Suspense>
      <AnalysisScreen />
    </Suspense>
  );
}

import { Suspense } from "react";

import { HealingPlanScreen } from "@/components/healing-plan-screen";

export default function HealingPage() {
  return (
    <Suspense>
      <HealingPlanScreen />
    </Suspense>
  );
}

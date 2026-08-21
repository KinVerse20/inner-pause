import { Suspense } from "react";

import { TellComposeScreen } from "@/components/tell-compose-screen";

export default function TellPage() {
  return (
    <Suspense>
      <TellComposeScreen />
    </Suspense>
  );
}

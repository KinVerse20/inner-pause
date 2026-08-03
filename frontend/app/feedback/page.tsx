import { Suspense } from "react";

import { SessionFeedbackScreen } from "@/components/session-feedback-screen";

export default function FeedbackPage() {
  return (
    <Suspense>
      <SessionFeedbackScreen />
    </Suspense>
  );
}

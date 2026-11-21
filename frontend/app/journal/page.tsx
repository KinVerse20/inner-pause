import { JournalEntryScreen } from "@/components/journal-entry-screen";
import { Suspense } from "react";

export default function JournalPage() {
  return (
    <Suspense fallback={null}>
      <JournalEntryScreen />
    </Suspense>
  );
}

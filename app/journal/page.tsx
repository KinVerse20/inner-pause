import { JournalEntryScreen } from "@/components/journal-entry-screen";

// Reads `context` (a Big Moment shortcut label, e.g. "Interview") and
// `voice` (auto-start Speak) from the query string — the minimal wiring
// that lets Pause Home's Big Moments row and Tell Inner Pause's Speak
// button hand off into this existing, reusable entry point without a
// purpose-built Big Moment screen (docs/UX_ARCHITECTURE.md §2's Tell Inner
// Pause — Compose spec; full Big Moment lifecycle is out of scope here).
export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string; voice?: string }>;
}) {
  const params = await searchParams;
  return <JournalEntryScreen initialContext={params.context} autoStartVoice={params.voice === "1"} />;
}

import { notFound } from "next/navigation";

import { PracticePathScreen } from "@/components/practice-path-screen";
import { findProgramme } from "@/lib/programme-data";

// One of the five Practice paths (lib/programme-data.ts):
// confidence · anxiety · focus · reactivity · sleep.
export default async function PracticePathPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = await params;
  if (!findProgramme(pathId)) notFound();
  return <PracticePathScreen pathId={pathId} />;
}

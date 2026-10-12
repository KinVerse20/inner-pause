import { notFound } from "next/navigation";

import { PracticeSkillJourneyScreen } from "@/components/practice-skill-journey-screen";
import { isPracticeSkillId, practiceSkillMap } from "@/lib/practice-skills";

// The dynamic segment is still named [pathId] (Next.js doesn't allow two
// different segment names at the same route level, and the legacy
// lib/practice-paths.ts / components/practice-path-screen.tsx this
// previously rendered are still imported elsewhere — see the comment
// there) — but its value is now a Practice skill id, not a chakra path id.
export default async function PracticeSkillPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;
  if (!isPracticeSkillId(pathId)) notFound();
  return <PracticeSkillJourneyScreen skill={practiceSkillMap[pathId]} />;
}

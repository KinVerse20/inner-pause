import { notFound } from "next/navigation";

import { PracticeSkillJourneyScreen } from "@/components/practice-skill-journey-screen";

// The dynamic segment is still named [pathId] (Next.js doesn't allow two
// different segment names at the same route level); its value is a
// Practice course id — one of the original seven or an admin-created one.
// Courses live in the admin-managed content store, read on the client, so
// only the id's shape is checked here.
export default async function PracticeSkillPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(pathId)) notFound();
  return <PracticeSkillJourneyScreen skillId={pathId} />;
}

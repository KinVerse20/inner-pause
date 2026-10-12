import { Suspense } from "react";
import { notFound } from "next/navigation";

import { PracticeSessionScreen } from "@/components/practice-session-screen";
import { isPracticeSkillId } from "@/lib/practice-skills";

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;
  if (!isPracticeSkillId(pathId)) notFound();
  return (
    <Suspense>
      <PracticeSessionScreen skillId={pathId} />
    </Suspense>
  );
}

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { PracticeSessionScreen } from "@/components/practice-session-screen";

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(pathId)) notFound();
  return (
    <Suspense>
      <PracticeSessionScreen skillId={pathId} />
    </Suspense>
  );
}

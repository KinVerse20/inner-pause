import { notFound } from "next/navigation";

import { PauseDetailScreen } from "@/components/pause-detail-screen";
import { isPauseCategoryId, pauseCategoryMap } from "@/lib/pause-categories";

export default async function PauseCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  if (!isPauseCategoryId(categoryId)) notFound();
  return <PauseDetailScreen category={pauseCategoryMap[categoryId]} />;
}

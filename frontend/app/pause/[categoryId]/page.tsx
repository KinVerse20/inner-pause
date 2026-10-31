import { notFound } from "next/navigation";

import { CategorySoundsScreen } from "@/components/category-sounds-screen";

// Any Home card's screen — the original six or an admin-created one. Cards
// live in the admin-managed content store, which is read on the client, so
// only the id's shape is checked here; an unknown id shows a gentle
// "not available" state in the screen itself.
export default async function PauseCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(categoryId)) notFound();
  return <CategorySoundsScreen cardId={categoryId} />;
}

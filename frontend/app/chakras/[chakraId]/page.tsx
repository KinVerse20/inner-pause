import { notFound } from "next/navigation";

import { ChakraDetailScreen } from "@/components/chakra-guide-screen";
import { findChakra } from "@/lib/chakra-guide";

export default async function ChakraDetailPage({ params }: { params: Promise<{ chakraId: string }> }) {
  const { chakraId } = await params;
  if (!findChakra(chakraId)) notFound();
  return <ChakraDetailScreen chakraId={chakraId} />;
}

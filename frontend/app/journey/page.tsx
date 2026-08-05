import { JourneyScreen } from "@/components/journey-screen";

export default async function JourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ chakra?: string }>;
}) {
  const params = await searchParams;

  return <JourneyScreen focusedChakraId={params.chakra} />;
}

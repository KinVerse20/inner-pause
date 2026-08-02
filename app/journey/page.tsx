import { AppShell } from "@/components/app-shell";
import { JourneyScreen } from "@/components/journey-screen";

export default async function JourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ chakra?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell
      title="Chakra journey"
      subtitle="Move through the seven chakra levels one session at a time. Only unlocked stages can be opened."
      showHeader={false}
    >
      <JourneyScreen focusedChakraId={params.chakra} />
    </AppShell>
  );
}

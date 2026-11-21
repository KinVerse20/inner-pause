import { AppShell } from "@/components/app-shell";
import { ChakrasScreen } from "@/components/chakras-screen";

export default function ChakrasPage() {
  return (
    <AppShell
      title="Chakras"
      subtitle="All seven Chakra tracks are available for direct listening. Journey unlocking still applies only to the structured path."
      showHeader={false}
    >
      <ChakrasScreen />
    </AppShell>
  );
}

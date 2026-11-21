import { AppShell } from "@/components/app-shell";
import { ProgressScreen } from "@/components/progress-screen";

export default function ProgressPage() {
  return (
    <AppShell
      title="Rewards and progress"
      subtitle="Track streaks, points, badges and the overall shape of your personal meditation journey."
    >
      <ProgressScreen />
    </AppShell>
  );
}

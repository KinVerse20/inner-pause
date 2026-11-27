import type { Metadata } from "next";

import { InstallScreen } from "@/components/install-screen";

export const metadata: Metadata = {
  title: "Get the app · Inner Pause",
  description: "Pause the noise. Return to you. Try 2 Pauses free, then the Inner Pause Pass.",
};

export default function InstallPage() {
  return <InstallScreen />;
}

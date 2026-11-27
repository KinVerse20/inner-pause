import type { Metadata } from "next";

import { WelcomeScreen } from "@/components/welcome-screen";

export const metadata: Metadata = {
  title: "Inner Pause · Pause the noise. Return to you.",
  description: "Short guided Pauses of sound and breath that steady you in about three minutes. Try 2 Pauses free.",
};

export default function WelcomePage() {
  return <WelcomeScreen />;
}

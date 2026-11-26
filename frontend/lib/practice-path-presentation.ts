import type { ComponentType } from "react";

import { IconFocus, IconMoon, IconReset, IconSpark, IconWave } from "@/components/pause-icons";
import type { PauseCategoryId } from "@/lib/pause-categories";
import type { ProgrammeId } from "@/lib/programme-data";

// How each of the five Practice paths sits in our design system: its tint
// family (BRAND_IDENTITY.md §4.4), its icon, and the Right Now category
// whose sound framework plays its daily Pause. The category's centre must
// match the path's own (lib/programme-data.ts): Uncertainty is Root 396 Hz
// (Reset), Emotional Regulation is Heart 639 Hz (Calm).
export const PATH_PRESENTATION: Record<
  ProgrammeId,
  { tone: string; category: PauseCategoryId; Icon: ComponentType<{ className?: string }> }
> = {
  confidence: { tone: "confidence", category: "confidence", Icon: IconSpark },
  anxiety: { tone: "calm", category: "reset", Icon: IconWave },
  focus: { tone: "focus", category: "focus", Icon: IconFocus },
  reactivity: { tone: "reset", category: "calm", Icon: IconReset },
  sleep: { tone: "sleep", category: "sleep", Icon: IconMoon },
};

export const PATH_LENGTH_DAYS = 14;

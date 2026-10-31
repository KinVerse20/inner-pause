import type { ComponentType, CSSProperties } from "react";

import type { CardIcon as CardIconName } from "@inner-pause/shared";

import {
  IconBriefcase,
  IconBubbles,
  IconFeather,
  IconFocus,
  IconMoon,
  IconReset,
  IconSignpost,
  IconSpark,
  IconSun,
  IconWave,
} from "@/components/pause-icons";

// The glyph set an admin can choose from for a Home card (shared CARD_ICONS).
export const CARD_ICON_COMPONENTS: Record<CardIconName, ComponentType<{ className?: string; style?: CSSProperties }>> = {
  moon: IconMoon,
  reset: IconReset,
  focus: IconFocus,
  spark: IconSpark,
  wave: IconWave,
  feather: IconFeather,
  sun: IconSun,
  bubbles: IconBubbles,
  signpost: IconSignpost,
  briefcase: IconBriefcase,
};

export function CardIcon({ icon, className }: { icon: CardIconName; className?: string }) {
  const Icon = CARD_ICON_COMPONENTS[icon] ?? IconWave;
  return <Icon className={className} />;
}

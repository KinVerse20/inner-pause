// Minimal line-icon set for the new design system (docs/DESIGN_SYSTEM.md
// §7: "soft geometry," restrained, no filled/decorative iconography).
// Scoped to screens rebuilt against the new tokens — currently Pause Home
// and its shell only. Every icon shares the same stroke weight/viewBox so
// the set reads as one coherent language rather than mixed styles.
import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

// Right Now outcomes
export function IconMoon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </Icon>
  );
}

export function IconReset(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
      <path d="M18 4v3.2h-3.2M6 20v-3.2h3.2" />
    </Icon>
  );
}

export function IconFocus(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.4" />
    </Icon>
  );
}

export function IconSpark(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5c.6 3 2 4.4 5 5-3 .6-4.4 2-5 5-.6-3-2-4.4-5-5 3-.6 4.4-2 5-5Z" />
      <path d="M18.5 15.5c.3 1.4 1 2.1 2.4 2.4-1.4.3-2.1 1-2.4 2.4-.3-1.4-1-2.1-2.4-2.4 1.4-.3 2.1-1 2.4-2.4Z" />
    </Icon>
  );
}

export function IconWave(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 13c1.4 0 1.4-2.4 2.8-2.4S7.7 13 9 13s1.4-2.4 2.8-2.4S13.2 13 14.6 13s1.4-2.4 2.8-2.4S18.8 13 20.2 13" />
      <path d="M3.5 17c1.4 0 1.4-2.4 2.8-2.4S7.7 17 9 17s1.4-2.4 2.8-2.4S13.2 17 14.6 17s1.4-2.4 2.8-2.4S18.8 17 20.2 17" opacity={0.5} />
    </Icon>
  );
}

export function IconFeather(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 5c-5.2.4-11.6 3.2-13.6 9.9C4.7 17.6 6 19 8 19c6.7-2 9.5-8.4 9.9-13.6.1-.9-.1-.4-.9-.4Z" />
      <path d="M13.5 10.5 6.5 17.5" />
    </Icon>
  );
}

// Tell Inner Pause
export function IconPencil(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20l.9-3.6L15.6 5.7a1.6 1.6 0 0 1 2.3 0l.4.4a1.6 1.6 0 0 1 0 2.3L7.6 19.1 4 20Z" />
      <path d="M13.8 7.5l2.7 2.7" />
    </Icon>
  );
}

export function IconMic(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9.25" y="3.5" width="5.5" height="10" rx="2.75" />
      <path d="M6 11.5a6 6 0 0 0 12 0" />
      <path d="M12 17.5v3M9.5 20.5h5" />
    </Icon>
  );
}

// Big Moments
export function IconBriefcase(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="7.5" width="17" height="11" rx="2" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
      <path d="M3.5 12.5h17" />
    </Icon>
  );
}

export function IconSignpost(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v16" />
      <path d="M12 7h6.2l1.8 2-1.8 2H12" />
      <path d="M12 11H6.8L5 13l1.8 2H12" />
    </Icon>
  );
}

export function IconBubbles(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5.5h8a2.5 2.5 0 0 1 2.5 2.5v3A2.5 2.5 0 0 1 17 13.5h-1.2L13 16v-2.5H9A2.5 2.5 0 0 1 6.5 11V8A2.5 2.5 0 0 1 9 5.5Z" />
      <path d="M6.2 13.6A2.5 2.5 0 0 1 4 16.1v1.9l2-1.5" opacity={0.6} />
    </Icon>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v3M16 3.5v3" />
    </Icon>
  );
}

// Bottom navigation (new shell only — see components/pause-shell.tsx). The
// center Pause position is an action, not a tab, and uses the real Harmony
// Form asset (public/branding/innerpause-pause-action.svg) — there is no
// generic pause icon in this set (docs/PRODUCT_FLOW.md §4).
export function IconHomeTab(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 11.5 12 4.5l7.5 7" />
      <path d="M6.5 9.5V19a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9.5" />
    </Icon>
  );
}

export function IconPracticeTab(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20V9" />
      <path d="M12 9c0-3-2-5.5-6-5.5C6.6 7 9 9 12 9Z" />
      <path d="M12 9c0-3 2-5.5 6-5.5C17.4 7 15 9 12 9Z" />
    </Icon>
  );
}

export function IconJourneyTab(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 19c3-6 4-11.5 8-14 4 2.5 5 8 8 14" />
      <circle cx="12" cy="10" r="1.4" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconYouTab(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.3" r="3.3" />
      <path d="M5 20c1.2-3.8 4-5.7 7-5.7s5.8 1.9 7 5.7" />
    </Icon>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </Icon>
  );
}

// Pause Player playback controls — standard audio-control iconography, not
// the brand mark (the mark is reserved for the center nav action, per
// docs/PRODUCT_FLOW.md §4 and docs/BRAND_IDENTITY.md §7).
export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function IconPlayGlyph(props: IconProps) {
  return (
    <Icon {...props} fill="currentColor" stroke="none">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </Icon>
  );
}

export function IconPauseGlyph(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="5.5" width="4" height="13" rx="1.5" fill="currentColor" stroke="none" />
      <rect x="13" y="5.5" width="4" height="13" rx="1.5" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 9.5 12 16l6.5-6.5" />
    </Icon>
  );
}

// Player controls (docs/DESIGN_SYSTEM.md §13: play/pause/restart/exit and
// volume/mute always explicit, never gesture-only).
export function IconRestart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
      <path d="M18 4v3.2h-3.2M6 20v-3.2h3.2" />
    </Icon>
  );
}

export function IconVolumeOn(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5v5h3.2L12 18V6L7.2 9.5H4Z" />
      <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M18.3 7.2a7 7 0 0 1 0 9.6" />
    </Icon>
  );
}

export function IconVolumeOff(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5v5h3.2L12 18V6L7.2 9.5H4Z" />
      <path d="M15.5 9.5l4 4M19.5 9.5l-4 4" />
    </Icon>
  );
}

// You area (components/you-*-screen.tsx) — Account/Pass/Preferences/
// Notifications/Privacy/Help row icons. Same restrained line-icon language
// as the rest of this set (docs/DESIGN_SYSTEM.md §7).
export function IconPerson(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.3" r="3.3" />
      <path d="M5 20c1.2-3.8 4-5.7 7-5.7s5.8 1.9 7 5.7" />
    </Icon>
  );
}

export function IconTicket(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5V7a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 7v2.5a2 2 0 0 0 0 4V17a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17v-3.5a2 2 0 0 0 0-4Z" />
      <path d="M14.5 6v12" strokeDasharray="1.6 2.2" />
    </Icon>
  );
}

export function IconSliders(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 6h5M14 6h5M5 12h9M18 12h1M5 18h1M10 18h9" />
      <circle cx="12" cy="6" r="1.8" fill="var(--ds-surface, #fff)" />
      <circle cx="16" cy="12" r="1.8" fill="var(--ds-surface, #fff)" />
      <circle cx="7" cy="18" r="1.8" fill="var(--ds-surface, #fff)" />
    </Icon>
  );
}

export function IconBell(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 10.5a5.5 5.5 0 0 1 11 0v3.2l1.6 2.6H4.9l1.6-2.6Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </Icon>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 19 6.5v5c0 5-3 8-7 9-4-1-7-4-7-9v-5Z" />
      <path d="M9.2 12l1.9 1.9 3.7-3.9" />
    </Icon>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="8" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth={2.4} />
    </Icon>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v11" />
      <path d="M7.5 11.5 12 16l4.5-4.5" />
      <path d="M5 19.5h14" />
    </Icon>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 7.5h14" />
      <path d="M9.5 7.5V6a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 6v1.5" />
      <path d="M7 7.5 7.8 19a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4l.8-11.5" />
      <path d="M10.3 11v6M13.7 11v6" />
    </Icon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5 9.5 17 19 6.5" />
    </Icon>
  );
}

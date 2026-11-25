import type { ComponentType } from "react";

// The tab bar's icons, each drawn twice: an outline at rest and a filled
// version for the tab you're on (the iOS / Material convention, so where
// you are reads at a glance). 24px grid, 1.7 stroke, rounded joins.

type NavIconProps = { active: boolean; className?: string };

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {children}
    </svg>
  );
}

export function NavHomeIcon({ active, className }: NavIconProps) {
  return (
    <Svg className={className}>
      <path
        d="M4.5 10.6 11.3 4.8a1.1 1.1 0 0 1 1.4 0l6.8 5.8c.3.2.5.6.5 1V19a1.5 1.5 0 0 1-1.5 1.5h-3.3V15a1.3 1.3 0 0 0-1.3-1.3h-3.8A1.3 1.3 0 0 0 8.8 15v5.5H5.5A1.5 1.5 0 0 1 4 19v-7.4c0-.4.2-.8.5-1Z"
        fill={active ? "currentColor" : "none"}
      />
    </Svg>
  );
}

export function NavPracticeIcon({ active, className }: NavIconProps) {
  return (
    <Svg className={className}>
      <path d="M12 20.5v-8.2" />
      <path d="M12 12.3c0-3.6-2.5-6.4-7-6.4 0 3.7 2.6 6.4 7 6.4Z" fill={active ? "currentColor" : "none"} />
      <path d="M12 10.3c0-3.4 2.3-6 6.6-6 0 3.4-2.4 6-6.6 6Z" fill={active ? "currentColor" : "none"} />
      <path d="M8.5 20.5h7" />
    </Svg>
  );
}

export function NavJourneyIcon({ active, className }: NavIconProps) {
  return (
    <Svg className={className}>
      <path d="M5 20.5c0-3 2.4-4.2 5-4.2h3.5c2 0 3.3-1.1 3.3-2.8s-1.3-2.8-3.3-2.8H12" strokeDasharray={active ? undefined : "0.1 3"} />
      <path d="M8 3.5a3.3 3.3 0 0 1 3.3 3.3c0 2.3-3.3 5.4-3.3 5.4S4.7 9.1 4.7 6.8A3.3 3.3 0 0 1 8 3.5Z" fill={active ? "currentColor" : "none"} />
      {active ? <circle cx="8" cy="6.8" r="1.1" fill="var(--ds-surface)" stroke="none" /> : <circle cx="8" cy="6.8" r="0.9" fill="currentColor" stroke="none" />}
    </Svg>
  );
}

export function NavYouIcon({ active, className }: NavIconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="3.6" fill={active ? "currentColor" : "none"} />
      <path d="M4.8 20.2c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6" fill={active ? "currentColor" : "none"} />
    </Svg>
  );
}

/** Moments: a sun over hills, like the landscapes inside it. */
export function NavMomentsIcon({ active, className }: NavIconProps) {
  return (
    <Svg className={className}>
      <circle cx="15.5" cy="8" r="2.6" fill={active ? "currentColor" : "none"} />
      <path d="M3 18.5c2.2-3.4 4.4-5.6 7-5.6 2.1 0 3.4 1.3 4.8 2.8 1.2-1 2.4-1.5 3.7-1.5 1 0 1.9.3 2.5.7v3.6H3Z" fill={active ? "currentColor" : "none"} />
      <path d="M3 20.5h18" />
    </Svg>
  );
}

export const NAV_ICONS: Record<string, ComponentType<NavIconProps>> = {
  "/": NavHomeIcon,
  "/moments": NavMomentsIcon,
  "/practice": NavPracticeIcon,
  "/journey": NavJourneyIcon,
  "/profile": NavYouIcon,
};

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

function NavIcon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === 'Home' ? <><path d="M4.5 11.5 12 4.5l7.5 7" /><path d="M6.5 9.5V19h11V9.5" /></> : kind === 'Practice' ? <><path d="M12 20V9M12 9C12 6 10 3.5 6 3.5 6.6 7 9 9 12 9ZM12 9c0-3 2-5.5 6-5.5C17.4 7 15 9 12 9Z" /></> : kind === 'Journey' ? <><path d="M4 19c3-6 4-11.5 8-14 4 2.5 5 8 8 14" /><circle cx="12" cy="10" r="1.4" /></> : <><circle cx="12" cy="8.3" r="3.3" /><path d="M5 20c1.2-3.8 4-5.7 7-5.7s5.8 1.9 7 5.7" /></>}</svg>;
}
export function LiveShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const pathname = usePathname();
  return <div className="live-shell"><main className="live-main">
    <header className="live-brand"><Link href="/revised"><span aria-hidden="true">∿</span> Inner Pause</Link><span className="live-eyebrow">A MOMENT FOR YOU</span></header>
    {children}
  </main>{!hideNav && <nav className="live-nav" aria-label="Main navigation"><div>
    {[['Home', '/revised'], ['Practice', '/chakras'], ['Pause', '/revised'], ['Journey', '/history'], ['You', '/profile']].map(([label, href]) => label === 'Pause'
      ? <Link key={label} href={href} aria-label="Start a Pause" className="live-pause">Ⅱ</Link>
      : <Link key={label} href={href} aria-current={pathname === href ? 'page' : undefined}><NavIcon kind={label} /><span>{label}</span></Link>)}
  </div></nav>}</div>;
}

import { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { InstallPwaPrompt } from "@/components/install-pwa-prompt";

export function AppShell({
  children,
  title,
  subtitle,
  showHeader = true,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showHeader?: boolean;
}) {
  return (
    <div className="cosmic-app-bg min-h-screen text-slate-50">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6">
        {showHeader ? (
          <header className="mb-6">
            <p className="text-xs uppercase text-amber-200/70">Chakra Journey</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm text-slate-300">{subtitle}</p> : null}
          </header>
        ) : null}
        <InstallPwaPrompt />
        <div className="flex-1">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}

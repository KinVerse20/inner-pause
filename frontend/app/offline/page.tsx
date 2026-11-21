import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.12),_transparent_34%),linear-gradient(180deg,#0f172a_0%,#111827_42%,#1e293b_100%)] px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))] text-slate-50 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col items-center justify-center text-center">
        <div className="h-24 w-24 rounded-full border border-amber-200/30 bg-[radial-gradient(circle,_rgba(251,191,36,0.3),_rgba(251,191,36,0.05)_55%,_transparent_72%)] shadow-[0_0_80px_rgba(251,191,36,0.2)]" />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white">You are offline.</h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
          Previously opened Chakra music may still be available.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white/92 px-6 py-3 text-sm font-medium text-slate-950 shadow-[0_8px_32px_rgba(255,255,255,0.12)]"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}

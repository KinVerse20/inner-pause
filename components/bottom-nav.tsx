"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavIcon } from "@/components/chakra-symbol";

const items = [
  { href: "/", label: "Relax" },
  { href: "/chakras", label: "Chakras" },
  { href: "/journey", label: "Journey" },
  { href: "/history", label: "History" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 border-t border-violet-300/15 bg-slate-950/82 shadow-[0_-24px_70px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
      <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-center text-xs transition ${
                active
                  ? "text-violet-200"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-full ${
                  active ? "bg-violet-400/18 text-violet-200 shadow-[0_0_28px_rgba(167,139,250,0.35)]" : ""
                }`}
              >
                <NavIcon label={item.label} className="h-5 w-5" />
              </span>
              {item.label}
              {active ? <span className="mt-0.5 h-1 w-7 rounded-full bg-violet-400" /> : <span className="h-1" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

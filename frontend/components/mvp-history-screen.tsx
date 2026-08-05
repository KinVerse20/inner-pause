"use client";

import { useMemo, useState } from "react";

import { GlassCard, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { deleteJournalEntry } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

const filters = ["All", "Insights", "Sessions", "Journal", "Favourites"] as const;

const fallbackLogs = [
  { title: "Calm", time: "08:24" },
  { title: "Focus", time: "06:12" },
  { title: "Energy", time: "09:03" },
  { title: "Balance", time: "07:45" },
  { title: "Restore", time: "05:30" },
  { title: "Clarity", time: "07:10" },
];

export function MvpHistoryScreen() {
  const state = useMvpState();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const entries = useMemo(() => {
    return state.entries.filter((entry) => {
      if (filter === "Insights") return Boolean(entry.analysis);
      if (filter === "Sessions") return Boolean(entry.plan || entry.feedback);
      if (filter === "Journal") return !entry.isTemporary;
      if (filter === "Favourites") return false;
      return true;
    });
  }, [filter, state.entries]);
  const selectedEntry = entries.find((entry) => entry.id === selectedId);

  return (
    <MvpShell>
      <div className="grid min-w-0 max-w-full gap-4 lg:grid-cols-[minmax(22rem,32rem)_minmax(0,1fr)]">
        <section className="obsidian-panel min-w-0 max-w-full overflow-hidden rounded-[1.35rem] p-3.5 sm:p-5 lg:min-h-[calc(100dvh-2.5rem)] lg:rounded-[1.8rem] lg:p-7">
          <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full text-2xl text-[var(--ip-body)]" aria-label="Open logs menu">☰</button>
            <h1 className="minimal-label text-center text-xs">Logs</h1>
            <button type="button" onClick={() => setFilter(filter === "All" ? "Insights" : "All")} className="grid h-11 w-11 place-items-center rounded-full text-xl text-[var(--ip-body)]" aria-label="Filter logs">≡</button>
          </header>

          <div className="mt-6 min-w-0 max-w-full space-y-3 sm:mt-10 sm:space-y-4">
            {entries.length === 0
              ? fallbackLogs.map((item) => <MinimalLogCard key={item.title} title={item.title} time={item.time} />)
              : entries.map((entry) => {
                  const primaryChakra = entry.analysis?.chakraAssociations[0]?.chakra;
                  const title = entry.analysis?.emotions[0]?.name ?? entry.title ?? "Reflection";
                  const time = new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  return (
                    <MinimalLogCard
                      key={entry.id}
                      title={title}
                      time={time}
                      active={entry.id === selectedId}
                      chakraColor={primaryChakra ? chakraMap[primaryChakra].color : undefined}
                      onClick={() => setSelectedId(entry.id)}
                    />
                  );
                })}
          </div>
        </section>

        <aside className="obsidian-panel min-w-0 max-w-full overflow-hidden rounded-[1.35rem] p-3.5 sm:p-5 lg:min-h-[calc(100dvh-2.5rem)] lg:rounded-[1.8rem]">
          <div className="grid max-w-full grid-cols-2 gap-2 pb-3 min-[390px]:grid-cols-3 sm:flex sm:flex-wrap">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`min-h-10 min-w-0 rounded-full border px-2 text-[0.68rem] uppercase tracking-[0.11em] sm:px-4 sm:text-xs sm:tracking-[0.22em] ${filter === item ? "border-[rgba(255,138,50,0.58)] text-[var(--gold-light)]" : "border-white/10 text-[var(--ip-muted)]"}`}
              >
                {item}
              </button>
            ))}
          </div>

          {selectedEntry ? (
            <div className="mt-8 space-y-4">
              <p className="minimal-label text-xs">Detail</p>
              <h2 className="overflow-wrap-anywhere text-3xl font-medium text-[var(--ip-ink)]">{selectedEntry.analysis?.emotions[0]?.name ?? selectedEntry.title}</h2>
              <p className="overflow-wrap-anywhere text-lg leading-7 text-[var(--ip-body)]">{selectedEntry.analysis?.understandingSummary ?? selectedEntry.analysis?.summary ?? selectedEntry.rawText}</p>
              <div className="flex flex-wrap gap-2">
                {selectedEntry.analysis?.chakraAssociations.slice(0, 4).map((item) => (
                  <span key={item.chakra} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-sm text-[var(--ip-body)]">
                    {chakraMap[item.chakra].name.replace(" Chakra", "")}
                  </span>
                ))}
              </div>
              <button type="button" onClick={() => deleteJournalEntry(selectedEntry.id)} className="min-h-11 rounded-full border border-red-400/30 px-4 text-sm uppercase tracking-[0.2em] text-red-300">Delete</button>
            </div>
          ) : (
            <GlassCard className="mt-8 p-5">
              <p className="minimal-label text-xs">Archive</p>
              <p className="mt-3 text-2xl text-[var(--ip-ink)]">{entries.length ? "Select a log" : "No saved logs"}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">{entries.length ? "Open a reflection, insight or session detail." : "Use Express to create your first reflection."}</p>
            </GlassCard>
          )}
        </aside>
      </div>
    </MvpShell>
  );
}

function MinimalLogCard({
  title,
  time,
  active = false,
  chakraColor,
  onClick,
}: {
  title: string;
  time: string;
  active?: boolean;
  chakraColor?: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`obsidian-panel tap-ripple flex min-h-[5rem] w-full max-w-full items-center gap-2.5 overflow-hidden rounded-[1.05rem] p-3 text-left sm:min-h-[5.5rem] sm:gap-4 sm:rounded-[1.15rem] sm:p-4 ${active ? "border-[rgba(255,138,50,0.42)]" : ""}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.035] sm:h-12 sm:w-12">
        <span className="h-5 w-5 rounded-full border border-white/20" style={{ boxShadow: `0 0 18px ${chakraColor ?? "rgba(255,138,50,0.45)"}` }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="minimal-label block max-w-full truncate text-[0.72rem] sm:text-[0.82rem]">{title}</span>
        <span className="mt-1 block text-lg text-[var(--ip-muted)]">{time}</span>
      </span>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold-primary)] shadow-[0_0_12px_rgba(255,138,50,0.8)]" />
    </button>
  );
}

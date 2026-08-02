"use client";

import { useMemo, useState } from "react";

import { GlassCard, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { deleteJournalEntry } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

export function MvpHistoryScreen() {
  const state = useMvpState();
  const [query, setQuery] = useState("");
  const [chakraFilter, setChakraFilter] = useState("all");
  const entries = useMemo(
    () =>
      state.entries.filter((entry) => {
        const text = `${entry.title} ${entry.rawText} ${entry.analysis?.summary ?? ""}`.toLowerCase();
        const matchesQuery = !query || text.includes(query.toLowerCase());
        const matchesChakra =
          chakraFilter === "all" || entry.analysis?.chakraAssociations.some((item) => item.chakra === chakraFilter);
        return matchesQuery && matchesChakra;
      }),
    [chakraFilter, query, state.entries],
  );

  return (
    <MvpShell>
      <div className="space-y-5">
        <SectionTitle title="Journal History" copy="Private timeline of reflections, analysis, healing plans and session feedback stored on this device." />
        <GlassCard className="grid gap-3 p-4 sm:grid-cols-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search entries" className="rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100 outline-none" />
          <select value={chakraFilter} onChange={(event) => setChakraFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100">
            <option value="all">All chakras</option>
            {Object.values(chakraMap).map((chakra) => <option key={chakra.id} value={chakra.id}>{chakra.name}</option>)}
          </select>
        </GlassCard>

        {entries.length === 0 ? (
          <GlassCard className="p-6 text-sm text-stone-300">No journal entries yet. Create a journal entry to unlock analysis and personalised healing.</GlassCard>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <GlassCard key={entry.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--gold-muted)]">{new Date(entry.createdAt).toLocaleDateString()}</p>
                    <h2 className="mt-2 font-serif text-2xl text-stone-100">{entry.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-400">{entry.analysis?.summary ?? entry.rawText}</p>
                  </div>
                  <button type="button" onClick={() => deleteJournalEntry(entry.id)} className="text-xs text-stone-500">Delete</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.analysis?.emotions.map((emotion) => (
                    <span key={emotion.name} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-stone-300">{emotion.name} • {emotion.level}</span>
                  ))}
                  {entry.analysis?.chakraAssociations.map((item) => (
                    <span key={item.chakra} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: chakraMap[item.chakra].accent, color: chakraMap[item.chakra].accent }}>
                      {chakraMap[item.chakra].name}
                    </span>
                  ))}
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-stone-400">{entry.isTemporary ? "Temporary" : "Saved"}</span>
                </div>
                {entry.feedback ? (
                  <p className="mt-4 text-sm text-stone-300">
                    Before {entry.emotionalIntensityBefore}/10 → After {entry.feedback.emotionalIntensityAfter}/10
                  </p>
                ) : null}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </MvpShell>
  );
}
